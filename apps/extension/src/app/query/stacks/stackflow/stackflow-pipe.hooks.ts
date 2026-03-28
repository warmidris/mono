import { useQuery } from '@tanstack/react-query';

import { parseGetPipeResponse } from '@leather.io/stacks';

import { createGetStackflowPipeQueryOptions } from './stackflow-pipe.query';

type UseStackflowPipeOnChainStateArgs = Parameters<typeof createGetStackflowPipeQueryOptions>[0];

export function useStackflowPipeOnChainState(args: UseStackflowPipeOnChainStateArgs) {
  const query = useQuery(createGetStackflowPipeQueryOptions(args));

  return {
    ...query,
    pipeState: query.data ? parseGetPipeResponse(query.data) : null,
  };
}
