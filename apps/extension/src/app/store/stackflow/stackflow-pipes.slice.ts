import { type PayloadAction, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import {
  type StackflowPipeState,
  type StackflowSignatureRecord,
  maxPipeHistoryLength,
} from '@leather.io/stacks';
import { resetWallet } from '@leather.io/state';

export const stackflowPipesAdapter = createEntityAdapter<StackflowPipeState, string>({
  selectId: pipe => pipe.id,
  sortComparer: (a, b) => b.addedAt - a.addedAt,
});

const initialStackflowPipesState = stackflowPipesAdapter.getInitialState();

export const stackflowPipesSlice = createSlice({
  name: 'stackflowPipes',
  initialState: initialStackflowPipesState,
  reducers: {
    pipeTracked(state, action: PayloadAction<StackflowPipeState>) {
      const existing = state.entities[action.payload.id];
      if (existing) return;
      stackflowPipesAdapter.addOne(state, action.payload);
    },
    signatureRecorded(
      state,
      action: PayloadAction<{ pipeKey: string; signature: StackflowSignatureRecord }>
    ) {
      const existing = state.entities[action.payload.pipeKey];
      if (!existing) return;
      existing.latestSignature = action.payload.signature;
      existing.history.push(action.payload.signature);
      if (existing.history.length > maxPipeHistoryLength) {
        existing.history = existing.history.slice(-maxPipeHistoryLength);
      }
    },
    pipeRemoved(state, action: PayloadAction<string>) {
      stackflowPipesAdapter.removeOne(state, action.payload);
    },
  },
  extraReducers(builder) {
    builder.addCase(resetWallet, state => {
      stackflowPipesAdapter.removeAll(state);
    });
  },
});
