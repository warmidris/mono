import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Flex, Stack, styled } from 'leather-styles/jsx';

import {
  type StackflowPipeId,
  createStackflowPipeKey,
  getStackflowKnownContracts,
} from '@leather.io/stacks';
import { Caption } from '@leather.io/ui';

import { RouteUrls } from '@shared/route-urls';

import { Content } from '@app/components/layout';
import { Header } from '@app/components/layout/headers/header';
import { HeaderBackButton } from '@app/components/layout/headers/header-back-button';
import { HeaderGrid } from '@app/components/layout/headers/header-grid';
import { HeaderNetwork } from '@app/components/layout/headers/header-network';
import { useCurrentStacksAccount } from '@app/store/accounts/blockchain/stacks/stacks-account.hooks';
import { useStackflowPipeActions } from '@app/store/stackflow/stackflow-pipes.hooks';

export function StackflowImportPipe() {
  const navigate = useNavigate();
  const account = useCurrentStacksAccount();
  const { trackPipe } = useStackflowPipeActions();
  const knownContracts = getStackflowKnownContracts();

  const [contractId, setContractId] = useState(knownContracts[0]?.contractId ?? '');
  const [counterparty, setCounterparty] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  function handleImport() {
    const address = account?.address;
    if (!address) {
      setError('No active Stacks account');
      return;
    }
    if (!counterparty.startsWith('SP') && !counterparty.startsWith('ST')) {
      setError('Invalid counterparty address');
      return;
    }
    if (counterparty === address) {
      setError('Counterparty cannot be your own address');
      return;
    }

    const tokenValue = token.trim() || null;
    const principals = [address, counterparty].sort();
    const principal1 = principals[0];
    const principal2 = principals[1];
    if (!principal1 || !principal2) return;
    const pipeId: StackflowPipeId = {
      contractId,
      token: tokenValue,
      principal1,
      principal2,
    };

    trackPipe({
      id: createStackflowPipeKey(pipeId),
      pipeId,
      chainId: contractId.startsWith('SP') ? '1' : '2147483648',
      latestSignature: null,
      history: [],
      addedAt: Date.now(),
      source: 'manual-import',
    });

    void navigate(RouteUrls.StackflowPipes);
  }

  const inputStyles = {
    width: '100%',
    p: 'space.03',
    bg: 'ink.background-primary',
    border: '1px solid',
    borderColor: 'ink.border-default',
    borderRadius: 'sm',
    textStyle: 'caption.01',
    color: 'ink.text-primary',
    outline: 'none',
  } as const;

  return (
    <Flex height="100vh" direction="column">
      <Header px="space.04">
        <HeaderGrid
          leftCol={<HeaderBackButton />}
          centerCol={
            <styled.h1 textStyle="heading.05" textAlign="center">
              Import Channel
            </styled.h1>
          }
          rightCol={<HeaderNetwork />}
        />
      </Header>
      <Content>
        <Flex direction="column" width="100%" px="space.05" gap="space.04" py="space.04">
          <Stack gap="space.02">
            <styled.label textStyle="caption.01" color="ink.text-subdued">
              Contract
            </styled.label>
            <styled.select
              {...inputStyles}
              value={contractId}
              onChange={e => setContractId(e.target.value)}
            >
              {knownContracts.map(c => (
                <option key={c.contractId} value={c.contractId}>
                  {c.description}
                </option>
              ))}
            </styled.select>
          </Stack>

          <Stack gap="space.02">
            <styled.label textStyle="caption.01" color="ink.text-subdued">
              Counterparty address
            </styled.label>
            <styled.input
              {...inputStyles}
              placeholder="SP... or ST..."
              value={counterparty}
              onChange={e => setCounterparty(e.target.value)}
            />
          </Stack>

          <Stack gap="space.02">
            <styled.label textStyle="caption.01" color="ink.text-subdued">
              Token (optional, leave blank for STX)
            </styled.label>
            <styled.input
              {...inputStyles}
              placeholder="Contract principal for SIP-010 token"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
          </Stack>

          {error && <Caption color="red.action-primary-default">{error}</Caption>}

          <styled.button
            px="space.04"
            py="space.03"
            bg="ink.action-primary-default"
            borderRadius="sm"
            cursor="pointer"
            textStyle="label.02"
            color="white"
            width="100%"
            onClick={handleImport}
          >
            Import
          </styled.button>
        </Flex>
      </Content>
    </Flex>
  );
}
