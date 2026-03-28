import { useSelector } from 'react-redux';

import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@app/store';

import { stackflowPipesAdapter } from './stackflow-pipes.slice';

const stackflowPipesSelectors = stackflowPipesAdapter.getSelectors<RootState>(
  state => state.stackflowPipes
);

export function useStackflowPipes() {
  return useSelector(stackflowPipesSelectors.selectAll);
}

export function useStackflowPipeById(pipeKey: string) {
  return useSelector((state: RootState) => stackflowPipesSelectors.selectById(state, pipeKey));
}

export function selectStackflowPipesForPrincipal(principal: string) {
  return createSelector(stackflowPipesSelectors.selectAll, pipes =>
    pipes.filter(p => p.pipeId.principal1 === principal || p.pipeId.principal2 === principal)
  );
}
