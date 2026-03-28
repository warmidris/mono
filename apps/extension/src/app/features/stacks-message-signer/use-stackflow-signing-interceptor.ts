import { useCallback } from 'react';

import {
  createStackflowPipeKey,
  isKnownStackflowContract,
  parseStackflowTransferSummary,
} from '@leather.io/stacks';

import type { StructuredPayload } from '@app/features/stacks-message-signer/stacks-message-signing';
import { useTrackStackflowPipeFromSigning } from '@app/store/stackflow/stackflow-pipes.hooks';

interface SignatureData {
  signature: string;
  publicKey: string;
}

export function useStackflowSigningInterceptor(payload: StructuredPayload | null) {
  const trackPipe = useTrackStackflowPipeFromSigning();

  return useCallback(
    (signature: SignatureData) => {
      if (!payload || payload.messageType !== 'structured') return;

      const summary = parseStackflowTransferSummary(payload);
      if (!summary) return;
      if (!isKnownStackflowContract(summary.contractId)) return;

      const pipeId = {
        contractId: summary.contractId,
        token: summary.token,
        principal1: summary.principal1,
        principal2: summary.principal2,
      };

      trackPipe({
        pipeId,
        pipeKey: createStackflowPipeKey(pipeId),
        chainId: summary.chainId,
        signature: {
          nonce: summary.nonce,
          action: summary.action,
          balance1: summary.balance1,
          balance2: summary.balance2,
          actor: summary.actor,
          hashedSecret: summary.hashedSecret,
          validAfter: summary.validAfter,
          signedAt: Date.now(),
          signatureHex: signature.signature,
          publicKeyHex: signature.publicKey,
        },
      });
    },
    [payload, trackPipe]
  );
}
