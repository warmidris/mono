import { ChainId } from '@stacks/network';
import { Box, Stack, styled } from 'leather-styles/jsx';

import { isFtAsset } from '@leather.io/query';
import {
  type StackflowTransferSummary,
  getActionLabel,
  parseStackflowTransferSummary,
} from '@leather.io/stacks';

import { UnsignedMessage } from '@shared/signature/signature-types';

import { NoFeesWarningRow } from '@app/components/no-fees-warning-row';
import { SignMessageActions } from '@app/features/message-signer/stacks-sign-message-action';
import { useGetFungibleTokenMetadataQuery } from '@app/query/stacks/token-metadata/fungible-tokens/fungible-token-metadata.query';
import { useCurrentStacksAccount } from '@app/store/accounts/blockchain/stacks/stacks-account.hooks';

import { StructuredPayload } from '../stacks-message-signing';
import { StacksMessageSigningDisclaimer } from './message-signing-disclaimer';
import { StructuredDataBox } from './structured-data-box';

interface SignatureRequestStructuredDataContentProps {
  isLoading: boolean;
  onSignMessage(unsignedMessage: UnsignedMessage): Promise<void>;
  onCancelMessageSigning(): void;
  payload: StructuredPayload;
}

const stxDecimals = 6;

function truncateMiddle(value: string, prefix = 14, suffix = 12) {
  if (value.length <= prefix + suffix + 3) return value;
  return `${value.slice(0, prefix)}...${value.slice(-suffix)}`;
}

function getNetworkLabel(chainId: string): string {
  return chainId === String(ChainId.Mainnet) ? 'Mainnet' : 'Testnet';
}

function formatTokenAmount(rawAmount: string, decimals: number): string {
  if (decimals === 0) return rawAmount;
  const padded = rawAmount.padStart(decimals + 1, '0');
  const intPart = padded.slice(0, -decimals);
  const fracPart = padded.slice(-decimals).replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

interface BalanceRowProps {
  address: string;
  amount: string;
  isUser: boolean;
}

function BalanceRow({ address, amount, isUser }: BalanceRowProps) {
  return (
    <Box
      px="space.03"
      py="space.03"
      borderRadius="xs"
      bg={isUser ? 'ink.background-secondary' : undefined}
    >
      <styled.div textStyle="caption.01" color="ink.text-subdued" mb="space.01">
        {truncateMiddle(address)}
        {isUser ? ' (you)' : ''}
      </styled.div>
      <styled.div textStyle="body.01" fontWeight={isUser ? 'medium' : 'regular'}>
        {amount}
      </styled.div>
    </Box>
  );
}

function useTokenDisplay(token: string | null) {
  const tokenQuery = useGetFungibleTokenMetadataQuery(token ?? '');
  if (!token) return { symbol: 'STX', decimals: stxDecimals };
  const metadata = tokenQuery.data;
  if (!metadata || !isFtAsset(metadata)) return { symbol: undefined, decimals: undefined };
  return {
    symbol: metadata.symbol ?? undefined,
    decimals: metadata.decimals ?? undefined,
  };
}

function StackflowTransferSummaryBox({ summary }: { summary: StackflowTransferSummary }) {
  const account = useCurrentStacksAccount();
  const userAddress = account?.address;
  const isUserPrincipal1 = userAddress === summary.principal1;
  const isUserPrincipal2 = userAddress === summary.principal2;
  const { symbol, decimals } = useTokenDisplay(summary.token);

  function formatBalance(raw: string): string {
    if (decimals == null) return raw;
    const formatted = formatTokenAmount(raw, decimals);
    return symbol ? `${formatted} ${symbol}` : formatted;
  }

  return (
    <Box
      border="active"
      borderColor="ink.border-default"
      borderRadius="sm"
      padding="space.05"
      mb="space.05"
      background="ink.background-primary"
    >
      <Stack gap="space.04">
        <Stack gap="space.01">
          <styled.h2 textStyle="label.01">StackFlow — {getActionLabel(summary)}</styled.h2>
          <styled.div textStyle="caption.01" color="ink.text-subdued">
            {truncateMiddle(summary.contractId)} · {getNetworkLabel(summary.chainId)}
          </styled.div>
        </Stack>

        <Stack gap="space.02">
          <styled.div textStyle="label.02" color="ink.text-subdued">
            Channel balances
          </styled.div>
          <BalanceRow
            address={summary.principal1}
            amount={formatBalance(summary.balance1)}
            isUser={isUserPrincipal1}
          />
          <BalanceRow
            address={summary.principal2}
            amount={formatBalance(summary.balance2)}
            isUser={isUserPrincipal2}
          />
        </Stack>

        <Stack gap="space.02">
          <styled.div textStyle="label.02" color="ink.text-subdued">
            Details
          </styled.div>
          <styled.div textStyle="body.02">Nonce: {summary.nonce}</styled.div>
          <styled.div textStyle="body.02">Actor: {truncateMiddle(summary.actor)}</styled.div>
          {summary.token && (
            <styled.div textStyle="body.02">
              Token: {truncateMiddle(summary.token, 18, 16)}
            </styled.div>
          )}
          {summary.hashedSecret && (
            <styled.div textStyle="body.02" wordBreak="break-all">
              Hashed secret: {summary.hashedSecret}
            </styled.div>
          )}
          {summary.validAfter && (
            <styled.div textStyle="body.02">Valid after: {summary.validAfter}</styled.div>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export function SignatureRequestStructuredDataContent({
  isLoading,
  onSignMessage,
  onCancelMessageSigning,
  payload,
}: SignatureRequestStructuredDataContentProps) {
  const stackflowSummary = parseStackflowTransferSummary(payload);
  return (
    <>
      {stackflowSummary ? (
        <StackflowTransferSummaryBox summary={stackflowSummary} />
      ) : (
        <StructuredDataBox message={payload.message} domain={payload.domain} />
      )}
      <NoFeesWarningRow chainId={payload.network?.chainId ?? ChainId.Testnet} />
      <SignMessageActions
        isLoading={isLoading}
        onSignMessageCancel={onCancelMessageSigning}
        onSignMessage={() =>
          void onSignMessage({
            messageType: 'structured',
            message: payload.message,
            domain: payload.domain,
          })
        }
      />
      <hr />
      <StacksMessageSigningDisclaimer appName={payload.appName} />
    </>
  );
}
