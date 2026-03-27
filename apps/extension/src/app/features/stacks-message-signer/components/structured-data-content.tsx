import { ChainId } from '@stacks/network';
import { Box, Stack, styled } from 'leather-styles/jsx';

import {
  type StackflowTransferSummary,
  getActionLabel,
  parseStackflowTransferSummary,
} from '@leather.io/stacks';

import { UnsignedMessage } from '@shared/signature/signature-types';

import { NoFeesWarningRow } from '@app/components/no-fees-warning-row';
import { SignMessageActions } from '@app/features/message-signer/stacks-sign-message-action';
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

function truncateMiddle(value: string, prefix = 14, suffix = 12) {
  if (value.length <= prefix + suffix + 3) return value;
  return `${value.slice(0, prefix)}...${value.slice(-suffix)}`;
}

function getNetworkLabel(chainId: string): string {
  return chainId === String(ChainId.Mainnet) ? 'Mainnet' : 'Testnet';
}

interface BalanceRowProps {
  label: string;
  balance: string;
  isUser: boolean;
}

function BalanceRow({ label, balance, isUser }: BalanceRowProps) {
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      px="space.03"
      py="space.02"
      borderRadius="xs"
      bg={isUser ? 'ink.background-secondary' : undefined}
    >
      <styled.span textStyle="body.02" fontWeight={isUser ? 'medium' : 'regular'}>
        {label}
        {isUser ? ' (you)' : ''}
      </styled.span>
      <styled.span textStyle="body.02" fontWeight={isUser ? 'medium' : 'regular'}>
        {balance} raw units
      </styled.span>
    </Box>
  );
}

function StackflowTransferSummaryBox({ summary }: { summary: StackflowTransferSummary }) {
  const account = useCurrentStacksAccount();
  const userAddress = account?.address;
  const isUserPrincipal1 = userAddress === summary.principal1;
  const isUserPrincipal2 = userAddress === summary.principal2;

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
          <styled.h2 textStyle="label.01">StackFlow channel update</styled.h2>
          <styled.div textStyle="body.02" color="ink.text-subdued">
            {getActionLabel(summary)}
          </styled.div>
        </Stack>

        <Stack gap="space.01">
          <styled.div textStyle="caption.01" color="ink.text-subdued">
            {truncateMiddle(summary.contractId)} · {getNetworkLabel(summary.chainId)}
          </styled.div>
        </Stack>

        <Stack gap="space.02">
          <styled.div textStyle="label.02" color="ink.text-subdued">
            Balances
          </styled.div>
          <BalanceRow
            label={truncateMiddle(summary.principal1)}
            balance={summary.balance1}
            isUser={isUserPrincipal1}
          />
          <BalanceRow
            label={truncateMiddle(summary.principal2)}
            balance={summary.balance2}
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
            <styled.div textStyle="body.02">
              Hashed secret: {truncateMiddle(summary.hashedSecret, 18, 14)}
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
