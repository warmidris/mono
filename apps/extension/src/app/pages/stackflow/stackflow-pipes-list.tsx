import { useNavigate } from 'react-router';

import { Flex, Stack, styled } from 'leather-styles/jsx';

import { Caption } from '@leather.io/ui';

import { RouteUrls } from '@shared/route-urls';

import { Content } from '@app/components/layout';
import { Header } from '@app/components/layout/headers/header';
import { HeaderBackButton } from '@app/components/layout/headers/header-back-button';
import { HeaderGrid } from '@app/components/layout/headers/header-grid';
import { HeaderNetwork } from '@app/components/layout/headers/header-network';
import { useCurrentStacksAccount } from '@app/store/accounts/blockchain/stacks/stacks-account.hooks';
import { useStackflowPipesForPrincipal } from '@app/store/stackflow/stackflow-pipes.hooks';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function StackflowPipesList() {
  const navigate = useNavigate();
  const account = useCurrentStacksAccount();
  const address = account?.address ?? '';
  const pipes = useStackflowPipesForPrincipal(address);

  function getCounterparty(principal1: string, principal2: string): string {
    return principal1 === address ? principal2 : principal1;
  }

  return (
    <Flex height="100vh" direction="column">
      <Header px="space.04">
        <HeaderGrid
          leftCol={<HeaderBackButton />}
          centerCol={
            <styled.h1 textStyle="heading.05" textAlign="center">
              Payment Channels
            </styled.h1>
          }
          rightCol={<HeaderNetwork />}
        />
      </Header>
      <Content>
        <Flex direction="column" width="100%" px="space.05" gap="space.04">
          <styled.button
            textStyle="label.02"
            color="ink.action-primary-default"
            cursor="pointer"
            textAlign="right"
            onClick={() => navigate(RouteUrls.StackflowImportPipe)}
          >
            + Import channel
          </styled.button>

          {pipes.length === 0 && (
            <Stack h="100%" justify="center" align="center" py="space.06">
              <Caption>No payment channels found</Caption>
              <Caption>Channels will appear here when you sign StackFlow transactions</Caption>
            </Stack>
          )}

          <Stack gap="space.03">
            {pipes.map(pipe => {
              const counterparty = getCounterparty(pipe.pipeId.principal1, pipe.pipeId.principal2);
              let latestBalance = '—';
              if (pipe.latestSignature) {
                latestBalance =
                  pipe.pipeId.principal1 === address
                    ? pipe.latestSignature.balance1
                    : pipe.latestSignature.balance2;
              }

              return (
                <styled.button
                  key={pipe.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p="space.04"
                  bg="ink.background-secondary"
                  borderRadius="sm"
                  border="1px solid"
                  borderColor="ink.border-default"
                  cursor="pointer"
                  width="100%"
                  onClick={() =>
                    navigate(
                      RouteUrls.StackflowPipeDetail.replace(':pipeKey', encodeURIComponent(pipe.id))
                    )
                  }
                >
                  <Stack gap="space.01" alignItems="flex-start">
                    <styled.span textStyle="label.02">{truncateAddress(counterparty)}</styled.span>
                    <styled.span textStyle="caption.01" color="ink.text-subdued">
                      {pipe.pipeId.token ?? 'STX'} · Nonce {pipe.latestSignature?.nonce ?? '0'}
                    </styled.span>
                  </Stack>
                  <styled.span textStyle="label.02">{latestBalance}</styled.span>
                </styled.button>
              );
            })}
          </Stack>
        </Flex>
      </Content>
    </Flex>
  );
}
