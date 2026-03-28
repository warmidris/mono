import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import { hexToBytes } from '@noble/hashes/utils';
import { PostConditionMode, deserializeCV, makeUnsignedContractCall } from '@stacks/transactions';

import { logger } from '@shared/logger';
import { RouteUrls } from '@shared/route-urls';

import { useRefreshAllAccountData } from '@app/common/hooks/account/use-refresh-all-account-data';
import { useSubmitTransactionCallback } from '@app/common/hooks/use-submit-stx-transaction';
import { useToast } from '@app/features/toasts/use-toast';
import { useNextNonce } from '@app/query/stacks/nonce/account-nonces.hooks';
import {
  useCurrentStacksAccount,
  useCurrentStacksAccountAddress,
} from '@app/store/accounts/blockchain/stacks/stacks-account.hooks';
import { useCurrentStacksNetworkState } from '@app/store/networks/networks.hooks';
import { useSignStacksTransaction } from '@app/store/transactions/transaction.hooks';
import { LoadingKeys } from '@app/store/ui/ui.hooks';

function cleanHex(hex: string): string {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

interface StackflowContractCallArgs {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: string[];
}

export function useStackflowContractCall() {
  const account = useCurrentStacksAccount();
  const address = useCurrentStacksAccountAddress();
  const network = useCurrentStacksNetworkState();
  const { data: nextNonce } = useNextNonce(address);
  const signStacksTransaction = useSignStacksTransaction();
  const refreshAccountData = useRefreshAllAccountData();
  const navigate = useNavigate();
  const toast = useToast();
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const broadcastTransactionFn = useSubmitTransactionCallback({
    loadingKey: LoadingKeys.SUBMIT_STACKS_TRANSACTION,
  });

  const submitTransaction = useCallback(
    async (args: StackflowContractCallArgs) => {
      if (!account || nextNonce?.nonce === undefined) {
        toast.error('Account or nonce not available');
        return;
      }

      try {
        setIsBroadcasting(true);

        const clarityArgs = args.functionArgs.map(hex => deserializeCV(hexToBytes(cleanHex(hex))));

        const unsignedTx = await makeUnsignedContractCall({
          contractAddress: args.contractAddress,
          contractName: args.contractName,
          functionName: args.functionName,
          functionArgs: clarityArgs,
          publicKey: account.stxPublicKey,
          network,
          nonce: nextNonce.nonce,
          fee: 10000,
          postConditionMode: PostConditionMode.Allow,
        });

        const signedTx = await signStacksTransaction(unsignedTx);
        if (!signedTx) {
          toast.error('Transaction signing cancelled');
          return;
        }

        await broadcastTransactionFn({
          onSuccess(txId) {
            toast.success('Transaction broadcast successfully');
            logger.info('StackFlow transaction broadcast', { txId });
            void navigate(RouteUrls.Activity);
          },
          onError(error) {
            const message = typeof error === 'string' ? error : error.message;
            logger.error('StackFlow broadcast error', { error: message });
            void navigate(RouteUrls.BroadcastError, { state: { message } });
          },
          replaceByFee: false,
        })(signedTx);

        await refreshAccountData();
      } catch (error) {
        logger.error('StackFlow contract call error', { error });
        toast.error('Transaction failed');
      } finally {
        setIsBroadcasting(false);
      }
    },
    [
      account,
      nextNonce,
      network,
      signStacksTransaction,
      broadcastTransactionFn,
      refreshAccountData,
      navigate,
      toast,
    ]
  );

  return { submitTransaction, isBroadcasting };
}
