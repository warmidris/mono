import { useNavigate, useParams } from 'react-router';

import { Flex, Stack, styled } from 'leather-styles/jsx';

import { type StackflowOnChainPipeState, getActionLabel } from '@leather.io/stacks';
import { Caption } from '@leather.io/ui';

import { RouteUrls } from '@shared/route-urls';

import { Content } from '@app/components/layout';
import { Header } from '@app/components/layout/headers/header';
import { HeaderBackButton } from '@app/components/layout/headers/header-back-button';
import { HeaderGrid } from '@app/components/layout/headers/header-grid';
import { HeaderNetwork } from '@app/components/layout/headers/header-network';
import { useStackflowPipeOnChainState } from '@app/query/stacks/stackflow/stackflow-pipe.hooks';
import { hiroFetchWrapper } from '@app/query/stacks/stacks-client';
import { useCurrentStacksAccountAddress } from '@app/store/accounts/blockchain/stacks/stacks-account.hooks';
import { useCurrentStacksNetworkState } from '@app/store/networks/networks.hooks';
import { useStackflowPipeActions } from '@app/store/stackflow/stackflow-pipes.hooks';
import { useStackflowPipeById } from '@app/store/stackflow/stackflow-pipes.selectors';

function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function ActionButton({
  label,
  onClick,
  variant = 'default',
}: {
  label: string;
  onClick(): void;
  variant?: 'default' | 'destructive';
}) {
  return (
    <styled.button
      px="space.04"
      py="space.03"
      bg={variant === 'destructive' ? 'red.background-secondary' : 'ink.background-secondary'}
      border="1px solid"
      borderColor={variant === 'destructive' ? 'red.border' : 'ink.border-default'}
      borderRadius="sm"
      cursor="pointer"
      textStyle="label.02"
      color={variant === 'destructive' ? 'red.action-primary-default' : 'ink.text-primary'}
      onClick={onClick}
      flex="1"
    >
      {label}
    </styled.button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex justifyContent="space-between" py="space.02">
      <styled.span textStyle="caption.01" color="ink.text-subdued">
        {label}
      </styled.span>
      <styled.span textStyle="caption.01" wordBreak="break-all" textAlign="right" maxW="60%">
        {value}
      </styled.span>
    </Flex>
  );
}

function OnChainStateSection({ state }: { state: StackflowOnChainPipeState }) {
  return (
    <Stack
      gap="space.02"
      p="space.04"
      bg="ink.background-secondary"
      borderRadius="sm"
      border="1px solid"
      borderColor="ink.border-default"
    >
      <styled.span textStyle="heading.05">On-Chain State</styled.span>
      <DetailRow label="Balance 1" value={state.balance1} />
      <DetailRow label="Balance 2" value={state.balance2} />
      <DetailRow label="Nonce" value={state.nonce} />
      <DetailRow label="Expires At" value={state.expiresAt} />
      {state.closer && <DetailRow label="Closer" value={truncateAddress(state.closer)} />}
      {state.pending1 && (
        <DetailRow
          label="Pending 1"
          value={`${state.pending1.amount} (block ${state.pending1.burnHeight})`}
        />
      )}
      {state.pending2 && (
        <DetailRow
          label="Pending 2"
          value={`${state.pending2.amount} (block ${state.pending2.burnHeight})`}
        />
      )}
    </Stack>
  );
}

export function StackflowPipeDetail() {
  const { pipeKey } = useParams<{ pipeKey: string }>();
  const navigate = useNavigate();
  const decodedKey = decodeURIComponent(pipeKey ?? '');
  const pipe = useStackflowPipeById(decodedKey);
  const { removePipe } = useStackflowPipeActions();
  const address = useCurrentStacksAccountAddress();
  const network = useCurrentStacksNetworkState();

  let counterparty = '';
  if (pipe) {
    counterparty =
      pipe.pipeId.principal1 === address ? pipe.pipeId.principal2 : pipe.pipeId.principal1;
  }

  const { pipeState: onChainState } = useStackflowPipeOnChainState({
    contractId: pipe?.pipeId.contractId ?? '',
    token: pipe?.pipeId.token ?? null,
    counterparty,
    senderAddress: address,
    network,
    client: { fetch: hiroFetchWrapper },
  });

  if (!pipe) {
    return (
      <Flex height="100vh" direction="column">
        <Header px="space.04">
          <HeaderGrid
            leftCol={<HeaderBackButton />}
            centerCol={
              <styled.h1 textStyle="heading.05" textAlign="center">
                Channel not found
              </styled.h1>
            }
            rightCol={<HeaderNetwork />}
          />
        </Header>
        <Content>
          <Stack justify="center" align="center" py="space.06">
            <Caption>This payment channel was not found</Caption>
          </Stack>
        </Content>
      </Flex>
    );
  }

  const { pipeId, latestSignature, history, chainId } = pipe;
  const token = pipeId.token ?? 'STX';
  function actionUrl(action: string) {
    return RouteUrls.StackflowPipeAction.replace(':pipeKey', encodeURIComponent(pipe.id)).replace(
      ':action',
      action
    );
  }

  return (
    <Flex height="100vh" direction="column">
      <Header px="space.04">
        <HeaderGrid
          leftCol={<HeaderBackButton />}
          centerCol={
            <styled.h1 textStyle="heading.05" textAlign="center">
              Channel Detail
            </styled.h1>
          }
          rightCol={<HeaderNetwork />}
        />
      </Header>
      <Content>
        <Flex direction="column" width="100%" px="space.05" gap="space.04" overflowY="auto">
          <Stack
            gap="space.02"
            p="space.04"
            bg="ink.background-secondary"
            borderRadius="sm"
            border="1px solid"
            borderColor="ink.border-default"
          >
            <styled.span textStyle="heading.05">Channel Info</styled.span>
            <DetailRow label="Principal 1" value={truncateAddress(pipeId.principal1)} />
            <DetailRow label="Principal 2" value={truncateAddress(pipeId.principal2)} />
            <DetailRow label="Token" value={token} />
            <DetailRow label="Contract" value={truncateAddress(pipeId.contractId)} />
            <DetailRow label="Chain ID" value={chainId} />
          </Stack>

          {onChainState && <OnChainStateSection state={onChainState} />}

          {latestSignature && (
            <Stack
              gap="space.02"
              p="space.04"
              bg="ink.background-secondary"
              borderRadius="sm"
              border="1px solid"
              borderColor="ink.border-default"
            >
              <styled.span textStyle="heading.05">Latest Signed State</styled.span>
              <DetailRow label="Balance 1" value={latestSignature.balance1} />
              <DetailRow label="Balance 2" value={latestSignature.balance2} />
              <DetailRow label="Nonce" value={latestSignature.nonce} />
              <DetailRow
                label="Action"
                value={getActionLabel({
                  ...pipeId,
                  chainId,
                  ...latestSignature,
                })}
              />
              <DetailRow label="Actor" value={truncateAddress(latestSignature.actor)} />
              {latestSignature.hashedSecret && (
                <DetailRow label="Hashed Secret" value={latestSignature.hashedSecret} />
              )}
              {latestSignature.validAfter && (
                <DetailRow label="Valid After" value={latestSignature.validAfter} />
              )}
            </Stack>
          )}

          <Flex gap="space.02" flexWrap="wrap">
            <ActionButton label="Close" onClick={() => navigate(actionUrl('close'))} />
            <ActionButton
              label="Force Close"
              onClick={() => navigate(actionUrl('force-close'))}
              variant="destructive"
            />
            <ActionButton
              label="Cancel Force Close"
              onClick={() => navigate(actionUrl('force-cancel'))}
            />
            <ActionButton label="Finalize" onClick={() => navigate(actionUrl('finalize'))} />
            <ActionButton label="Dispute" onClick={() => navigate(actionUrl('dispute'))} />
          </Flex>

          {history.length > 0 && (
            <Stack gap="space.02">
              <styled.span textStyle="heading.05">History ({history.length})</styled.span>
              {[...history].reverse().map((record, i) => (
                <Stack
                  key={`${record.nonce}-${i}`}
                  p="space.03"
                  bg="ink.background-secondary"
                  borderRadius="xs"
                  border="1px solid"
                  borderColor="ink.border-default"
                  gap="space.01"
                >
                  <Flex justifyContent="space-between">
                    <styled.span textStyle="caption.01">Nonce {record.nonce}</styled.span>
                    <styled.span textStyle="caption.01" color="ink.text-subdued">
                      {getActionLabel({
                        ...pipeId,
                        chainId,
                        ...record,
                      })}
                    </styled.span>
                  </Flex>
                  <styled.span textStyle="caption.02" color="ink.text-subdued">
                    {record.balance1} / {record.balance2}
                  </styled.span>
                </Stack>
              ))}
            </Stack>
          )}

          <styled.button
            textStyle="caption.01"
            color="red.action-primary-default"
            cursor="pointer"
            py="space.04"
            onClick={() => {
              removePipe(pipe.id);
              void navigate(RouteUrls.StackflowPipes);
            }}
          >
            Remove channel
          </styled.button>
        </Flex>
      </Content>
    </Flex>
  );
}
