import type { ClientParam } from '@stacks/common';
import type { StacksNetwork } from '@stacks/network';
import { Cl, fetchCallReadOnlyFunction, noneCV } from '@stacks/transactions';
import type { UseQueryOptions } from '@tanstack/react-query';

import { StacksQueryPrefixes } from '@leather.io/query';
import { splitContractId, stackflowContractFunctions } from '@leather.io/stacks';

const defaultQueryOptions = {
  refetchOnMount: true,
  refetchOnReconnect: false,
  refetchOnWindowFocus: true,
  refetchInterval: 30_000,
} as const;

interface CreateGetStackflowPipeQueryArgs {
  contractId: string;
  token: string | null;
  counterparty: string;
  senderAddress: string;
  network: StacksNetwork;
}

export function createGetStackflowPipeQueryOptions({
  contractId,
  token,
  counterparty,
  senderAddress,
  network,
  client,
}: CreateGetStackflowPipeQueryArgs & ClientParam) {
  return {
    queryKey: [
      StacksQueryPrefixes.GetStackflowPipe,
      contractId,
      token,
      counterparty,
      senderAddress,
      network,
      client,
    ],
    queryFn() {
      if (!senderAddress) return Promise.resolve(noneCV());
      const { address: contractAddress, name: contractName } = splitContractId(contractId);
      const tokenArg = token ? Cl.some(Cl.principal(token)) : Cl.none();
      return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: stackflowContractFunctions.getPipe,
        functionArgs: [tokenArg, Cl.principal(counterparty)],
        senderAddress,
        network,
        client,
      });
    },
    ...defaultQueryOptions,
  } satisfies UseQueryOptions;
}
