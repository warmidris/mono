import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import type {
  StackflowPipeId,
  StackflowPipeState,
  StackflowSignatureRecord,
} from '@leather.io/stacks';

import { type RootState, useAppDispatch } from '@app/store';

import { pipeRemoved, pipeTracked, signatureRecorded } from './stackflow-pipes.actions';
import { selectStackflowPipesForPrincipal } from './stackflow-pipes.selectors';

export function useStackflowPipesForPrincipal(principal: string) {
  return useSelector((state: RootState) => selectStackflowPipesForPrincipal(principal)(state));
}

export function useStackflowPipeActions() {
  const dispatch = useAppDispatch();

  return useMemo(
    () => ({
      trackPipe(pipe: StackflowPipeState) {
        return dispatch(pipeTracked(pipe));
      },
      recordSignature(pipeKey: string, signature: StackflowSignatureRecord) {
        return dispatch(signatureRecorded({ pipeKey, signature }));
      },
      removePipe(pipeKey: string) {
        return dispatch(pipeRemoved(pipeKey));
      },
    }),
    [dispatch]
  );
}

export function useTrackStackflowPipeFromSigning() {
  const { trackPipe, recordSignature } = useStackflowPipeActions();

  return useCallback(
    (args: {
      pipeId: StackflowPipeId;
      pipeKey: string;
      chainId: string;
      signature: StackflowSignatureRecord;
    }) => {
      trackPipe({
        id: args.pipeKey,
        pipeId: args.pipeId,
        chainId: args.chainId,
        latestSignature: null,
        history: [],
        addedAt: Date.now(),
        source: 'signing-event',
      });
      recordSignature(args.pipeKey, args.signature);
    },
    [trackPipe, recordSignature]
  );
}
