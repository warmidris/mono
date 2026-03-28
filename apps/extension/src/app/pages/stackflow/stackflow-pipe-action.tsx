import { useNavigate, useParams } from 'react-router';

import { Flex, Stack, styled } from 'leather-styles/jsx';

import { Caption } from '@leather.io/ui';

import { Content } from '@app/components/layout';
import { Header } from '@app/components/layout/headers/header';
import { HeaderBackButton } from '@app/components/layout/headers/header-back-button';
import { HeaderGrid } from '@app/components/layout/headers/header-grid';
import { HeaderNetwork } from '@app/components/layout/headers/header-network';
import { useStackflowPipeById } from '@app/store/stackflow/stackflow-pipes.selectors';

const actionLabels: Record<string, string> = {
  close: 'Close Channel',
  'force-close': 'Force Close Channel',
  finalize: 'Finalize Closure',
  dispute: 'Dispute Closure',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
};

export function StackflowPipeAction() {
  const { pipeKey, action } = useParams<{ pipeKey: string; action: string }>();
  const navigate = useNavigate();
  const pipe = useStackflowPipeById(decodeURIComponent(pipeKey ?? ''));

  if (!pipe || !action) {
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

  const label = actionLabels[action] ?? action;

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
              {label} for channel with{' '}
              {pipe.pipeId.principal1 === pipe.pipeId.principal2
                ? pipe.pipeId.principal2
                : pipe.pipeId.principal2}
            </Caption>
            {pipe.latestSignature && (
              <>
                <styled.span textStyle="caption.01" color="ink.text-subdued">
                  Latest nonce: {pipe.latestSignature.nonce}
                </styled.span>
                <styled.span textStyle="caption.01" color="ink.text-subdued">
                  Balances: {pipe.latestSignature.balance1} / {pipe.latestSignature.balance2}
                </styled.span>
              </>
            )}
          </Stack>

          <Caption color="ink.text-subdued">
            Transaction building and broadcasting will be connected here. This action will construct
            the appropriate StackFlow contract call and submit it to the network.
          </Caption>

          <styled.button
            px="space.04"
            py="space.03"
            bg="ink.action-primary-default"
            borderRadius="sm"
            cursor="pointer"
            textStyle="label.02"
            color="white"
            onClick={() => navigate(-1)}
          >
            Back
          </styled.button>
        </Flex>
      </Content>
    </Flex>
  );
}
