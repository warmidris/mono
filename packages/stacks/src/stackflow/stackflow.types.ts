export interface StackflowPipeId {
  contractId: string;
  token: string | null;
  principal1: string;
  principal2: string;
}

export interface StackflowSignatureRecord {
  nonce: string;
  action: string;
  balance1: string;
  balance2: string;
  actor: string;
  hashedSecret: string | null;
  validAfter: string | null;
  signedAt: number;
  signatureHex: string;
  publicKeyHex: string;
}

export interface StackflowPipeState {
  id: string;
  pipeId: StackflowPipeId;
  chainId: string;
  latestSignature: StackflowSignatureRecord | null;
  history: StackflowSignatureRecord[];
  addedAt: number;
  source: 'signing-event' | 'manual-import';
}

export interface StackflowOnChainPipeState {
  balance1: string;
  balance2: string;
  nonce: string;
  expiresAt: string;
  closer: string | null;
  pending1: { amount: string; burnHeight: string } | null;
  pending2: { amount: string; burnHeight: string } | null;
}

export const stackflowActions = {
  close: '0',
  transfer: '1',
  deposit: '2',
  withdrawal: '3',
} as const;

export type StackflowAction = (typeof stackflowActions)[keyof typeof stackflowActions];

export const stackflowContractFunctions = {
  fundPipe: 'fund-pipe',
  closePipe: 'close-pipe',
  forceClose: 'force-close',
  forceCancel: 'force-cancel',
  disputeClosure: 'dispute-closure',
  finalize: 'finalize',
  deposit: 'deposit',
  withdraw: 'withdraw',
  getPipe: 'get-pipe',
} as const;

export const maxPipeHistoryLength = 100;

export function createStackflowPipeKey(pipeId: StackflowPipeId): string {
  const tokenPart = pipeId.token ?? 'STX';
  return `${pipeId.contractId}::${tokenPart}::${pipeId.principal1}::${pipeId.principal2}`;
}
