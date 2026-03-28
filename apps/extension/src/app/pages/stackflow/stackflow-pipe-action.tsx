import { useParams } from 'react-router';

import { Flex, Stack, styled } from 'leather-styles/jsx';

import { getFinalizeContractCallArgs, getForceCancelContractCallArgs } from '@leather.io/stacks';
import { Caption } from '@leather.io/ui';

import { Content } from '@app/components/layout';
import { Header } from '@app/components/layout/headers/header';
import { HeaderBackButton } from '@app/components/layout/headers/header-back-button';
import { HeaderGrid } from '@app/components/layout/headers/header-grid';
import { HeaderNetwork } from '@app/components/layout/headers/header-network';
import { useCurrentStacksAccountAddress } from '@app/store/accounts/blockchain/stacks/stacks-account.hooks';
import { useStackflowPipeById } from '@app/store/stackflow/stackflow-pipes.selectors';

import { useStackflowContractCall } from './use-stackflow-contract-call';

const actionLabels: Record<string, string> = {
  close: 'Close Channel',
  'force-close': 'Force Close Channel',
  'force-cancel': 'Cancel Force Close',
  finalize: 'Finalize Closure',
  dispute: 'Dispute Closure',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
};

const simpleActions = new Set(['finalize', 'force-cancel']);

function NotFoundView() {
  return (
    <Flex height="100vh" direction="column">
      <Header px="space.04">
        <HeaderGrid
          leftCol={<HeaderBackButton />}
          centerCol={
            <styled.h1 textStyle="heading.05" textAlign="center">
              Not found
            </styled.h1>
          }
          rightCol={<HeaderNetwork />}
        />
      </Header>
      <Content>
        <Stack justify="center" align="center" py="space.06">
          <Caption>Channel or action not found</Caption>
        </Stack>
      </Content>
    </Flex>
  );
}

export function StackflowPipeAction() {
  const { pipeKey, action } = useParams<{ pipeKey: string; action: string }>();
  const pipe = useStackflowPipeById(decodeURIComponent(pipeKey ?? ''));
  const address = useCurrentStacksAccountAddress();
  const { submitTransaction, isBroadcasting } = useStackflowContractCall();

  if (!pipe || !action) return <NotFoundView />;

  const label = actionLabels[action] ?? action;
  const { pipeId, latestSignature } = pipe;
  const counterparty = pipeId.principal1 === address ? pipeId.principal2 : pipeId.principal1;
  const isSimple = simpleActions.has(action);

  function handleSubmit() {
    if (action === 'finalize') {
      const args = getFinalizeContractCallArgs({
        contractId: pipeId.contractId,
        token: pipeId.token,
        counterparty,
      });
      void submitTransaction(args);
      return;
    }

    if (action === 'force-cancel') {
      const args = getForceCancelContractCallArgs({
        contractId: pipeId.contractId,
        token: pipeId.token,
        counterparty,
      });
      void submitTransaction(args);
      return;
    }
  }

  return (
    <Flex height="100vh" direction="column">
      <Header px="space.04">
        <HeaderGrid
          leftCol={<HeaderBackButton />}
          centerCol={
            <styled.h1 textStyle="heading.05" textAlign="center">
              {label}
            </styled.h1>
          }
          rightCol={<HeaderNetwork />}
        />
      </Header>
      <Content>
        <Flex direction="column" width="100%" px="space.05" gap="space.04" py="space.04">
          <Stack
            gap="space.02"
            p="space.04"
            bg="ink.background-secondary"
            borderRadius="sm"
            border="1px solid"
            borderColor="ink.border-default"
          >
            <Caption>
              {label} for channel with {counterparty}
            </Caption>
            {latestSignature && (
              <>
                <styled.span textStyle="caption.01" color="ink.text-subdued">
                  Latest nonce: {latestSignature.nonce}
                </styled.span>
                <styled.span textStyle="caption.01" color="ink.text-subdued">
                  Balances: {latestSignature.balance1} / {latestSignature.balance2}
                </styled.span>
              </>
            )}
          </Stack>

          {isSimple ? (
            <styled.button
              px="space.04"
              py="space.03"
              bg="ink.action-primary-default"
              borderRadius="sm"
              cursor="pointer"
              textStyle="label.02"
              color="white"
              disabled={isBroadcasting}
              opacity={isBroadcasting ? 0.6 : 1}
              onClick={handleSubmit}
            >
              {isBroadcasting ? 'Broadcasting...' : `Submit ${label}`}
            </styled.button>
          ) : (
            <Caption color="ink.text-subdued">
              This action requires both parties' signatures and should be initiated through the
              channel coordinator application. The coordinator will request your wallet to sign the
              contract call.
            </Caption>
          )}
        </Flex>
      </Content>
    </Flex>
  );
}
