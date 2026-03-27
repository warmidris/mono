import { Divider } from '@/components/divider';
import { t } from '@lingui/core/macro';

import { type StackflowTransferSummary, getActionLabel } from '@leather.io/stacks';
import { Approver, Box, Text } from '@leather.io/ui/native';

function truncateMiddle(value: string, prefix = 14, suffix = 12) {
  if (value.length <= prefix + suffix + 3) return value;
  return `${value.slice(0, prefix)}...${value.slice(-suffix)}`;
}

interface StackflowTransferSummarySectionProps {
  summary: StackflowTransferSummary;
  userAddress?: string;
}

export function StackflowTransferSummarySection({
  summary,
  userAddress,
}: StackflowTransferSummarySectionProps) {
  const isUserPrincipal1 = userAddress === summary.principal1;
  const isUserPrincipal2 = userAddress === summary.principal2;
  const networkLabel = summary.chainId === '1' ? t`Mainnet` : t`Testnet`;

  return (
    <Approver.Section>
      <Text variant="label01">{t`StackFlow channel update`}</Text>
      <Box gap="2">
        <Text variant="label02">{getActionLabel(summary)}</Text>
        <Text variant="caption01" color="ink.text-subdued">
          {truncateMiddle(summary.contractId)} · {networkLabel}
        </Text>
        <Divider />
        <Text variant="label02" color="ink.text-subdued">{t`Balances`}</Text>
        <Box flexDirection="row" justifyContent="space-between">
          <Text>
            {truncateMiddle(summary.principal1)}
            {isUserPrincipal1 ? t` (you)` : ''}
          </Text>
          <Text>{summary.balance1}</Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-between">
          <Text>
            {truncateMiddle(summary.principal2)}
            {isUserPrincipal2 ? t` (you)` : ''}
          </Text>
          <Text>{summary.balance2}</Text>
        </Box>
        <Divider />
        <Text variant="label02" color="ink.text-subdued">{t`Details`}</Text>
        <Text>{t`Nonce`}: {summary.nonce}</Text>
        <Text>{t`Actor`}: {truncateMiddle(summary.actor)}</Text>
        {summary.token && <Text>{t`Token`}: {truncateMiddle(summary.token, 18, 16)}</Text>}
        {summary.hashedSecret && (
          <Text>{t`Hashed secret`}: {truncateMiddle(summary.hashedSecret, 18, 14)}</Text>
        )}
        {summary.validAfter && <Text>{t`Valid after`}: {summary.validAfter}</Text>}
      </Box>
    </Approver.Section>
  );
}
