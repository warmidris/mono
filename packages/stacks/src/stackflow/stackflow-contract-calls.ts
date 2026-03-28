import { Cl, type ClarityValue, type PostConditionWire, serializeCV } from '@stacks/transactions';

import { splitContractId } from './stackflow-contracts';
import { stackflowContractFunctions } from './stackflow.types';

function hexArg(cv: ClarityValue): string {
  return serializeCV(cv);
}

function optionalPrincipal(token: string | null): ClarityValue {
  return token ? Cl.some(Cl.principal(token)) : Cl.none();
}

function optionalBuff32(hex: string | null): ClarityValue {
  if (!hex) return Cl.none();
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return Cl.some(Cl.bufferFromHex(clean));
}

function optionalUint(value: string | null): ClarityValue {
  return value ? Cl.some(Cl.uint(value)) : Cl.none();
}

export interface StackflowClosePipeArgs {
  contractId: string;
  token: string | null;
  counterparty: string;
  myBalance: string;
  theirBalance: string;
  mySig: string;
  theirSig: string;
  nonce: string;
}

export function buildClosePipeFunctionArgs(args: StackflowClosePipeArgs): string[] {
  return [
    hexArg(optionalPrincipal(args.token)),
    hexArg(Cl.principal(args.counterparty)),
    hexArg(Cl.uint(args.myBalance)),
    hexArg(Cl.uint(args.theirBalance)),
    hexArg(Cl.bufferFromHex(args.mySig)),
    hexArg(Cl.bufferFromHex(args.theirSig)),
    hexArg(Cl.uint(args.nonce)),
  ];
}

export function getClosePipeContractCallArgs(args: StackflowClosePipeArgs) {
  const { address, name } = splitContractId(args.contractId);
  return {
    contractAddress: address,
    contractName: name,
    functionName: stackflowContractFunctions.closePipe,
    functionArgs: buildClosePipeFunctionArgs(args),
  };
}

export interface StackflowForceCloseArgs {
  contractId: string;
  token: string | null;
  counterparty: string;
  myBalance: string;
  theirBalance: string;
  mySig: string;
  theirSig: string;
  nonce: string;
  action: string;
  actor: string;
  secret: string | null;
  validAfter: string | null;
}

export function buildForceCloseFunctionArgs(args: StackflowForceCloseArgs): string[] {
  return [
    hexArg(optionalPrincipal(args.token)),
    hexArg(Cl.principal(args.counterparty)),
    hexArg(Cl.uint(args.myBalance)),
    hexArg(Cl.uint(args.theirBalance)),
    hexArg(Cl.bufferFromHex(args.mySig)),
    hexArg(Cl.bufferFromHex(args.theirSig)),
    hexArg(Cl.uint(args.nonce)),
    hexArg(Cl.uint(args.action)),
    hexArg(Cl.principal(args.actor)),
    hexArg(optionalBuff32(args.secret)),
    hexArg(optionalUint(args.validAfter)),
  ];
}

export function getForceCloseContractCallArgs(args: StackflowForceCloseArgs) {
  const { address, name } = splitContractId(args.contractId);
  return {
    contractAddress: address,
    contractName: name,
    functionName: stackflowContractFunctions.forceClose,
    functionArgs: buildForceCloseFunctionArgs(args),
  };
}

export interface StackflowForceCancelArgs {
  contractId: string;
  token: string | null;
  counterparty: string;
}

export function buildForceCancelFunctionArgs(args: StackflowForceCancelArgs): string[] {
  return [hexArg(optionalPrincipal(args.token)), hexArg(Cl.principal(args.counterparty))];
}

export function getForceCancelContractCallArgs(args: StackflowForceCancelArgs) {
  const { address, name } = splitContractId(args.contractId);
  return {
    contractAddress: address,
    contractName: name,
    functionName: stackflowContractFunctions.forceCancel,
    functionArgs: buildForceCancelFunctionArgs(args),
  };
}

export interface StackflowDisputeClosureArgs {
  contractId: string;
  token: string | null;
  counterparty: string;
  myBalance: string;
  theirBalance: string;
  mySig: string;
  theirSig: string;
  nonce: string;
  action: string;
  actor: string;
  secret: string | null;
  validAfter: string | null;
}

export function buildDisputeClosureFunctionArgs(args: StackflowDisputeClosureArgs): string[] {
  return [
    hexArg(optionalPrincipal(args.token)),
    hexArg(Cl.principal(args.counterparty)),
    hexArg(Cl.uint(args.myBalance)),
    hexArg(Cl.uint(args.theirBalance)),
    hexArg(Cl.bufferFromHex(args.mySig)),
    hexArg(Cl.bufferFromHex(args.theirSig)),
    hexArg(Cl.uint(args.nonce)),
    hexArg(Cl.uint(args.action)),
    hexArg(Cl.principal(args.actor)),
    hexArg(optionalBuff32(args.secret)),
    hexArg(optionalUint(args.validAfter)),
  ];
}

export function getDisputeClosureContractCallArgs(args: StackflowDisputeClosureArgs) {
  const { address, name } = splitContractId(args.contractId);
  return {
    contractAddress: address,
    contractName: name,
    functionName: stackflowContractFunctions.disputeClosure,
    functionArgs: buildDisputeClosureFunctionArgs(args),
  };
}

export interface StackflowFinalizeArgs {
  contractId: string;
  token: string | null;
  counterparty: string;
}

export function buildFinalizeFunctionArgs(args: StackflowFinalizeArgs): string[] {
  return [hexArg(optionalPrincipal(args.token)), hexArg(Cl.principal(args.counterparty))];
}

export function getFinalizeContractCallArgs(args: StackflowFinalizeArgs) {
  const { address, name } = splitContractId(args.contractId);
  return {
    contractAddress: address,
    contractName: name,
    functionName: stackflowContractFunctions.finalize,
    functionArgs: buildFinalizeFunctionArgs(args),
  };
}

export interface StackflowDepositArgs {
  contractId: string;
  amount: string;
  token: string | null;
  counterparty: string;
  myBalance: string;
  theirBalance: string;
  mySig: string;
  theirSig: string;
  nonce: string;
}

export function buildDepositFunctionArgs(args: StackflowDepositArgs): string[] {
  return [
    hexArg(Cl.uint(args.amount)),
    hexArg(optionalPrincipal(args.token)),
    hexArg(Cl.principal(args.counterparty)),
    hexArg(Cl.uint(args.myBalance)),
    hexArg(Cl.uint(args.theirBalance)),
    hexArg(Cl.bufferFromHex(args.mySig)),
    hexArg(Cl.bufferFromHex(args.theirSig)),
    hexArg(Cl.uint(args.nonce)),
  ];
}

export function getDepositContractCallArgs(args: StackflowDepositArgs) {
  const { address, name } = splitContractId(args.contractId);
  return {
    contractAddress: address,
    contractName: name,
    functionName: stackflowContractFunctions.deposit,
    functionArgs: buildDepositFunctionArgs(args),
  };
}

export interface StackflowWithdrawArgs {
  contractId: string;
  amount: string;
  token: string | null;
  counterparty: string;
  myBalance: string;
  theirBalance: string;
  mySig: string;
  theirSig: string;
  nonce: string;
}

export function buildWithdrawFunctionArgs(args: StackflowWithdrawArgs): string[] {
  return [
    hexArg(Cl.uint(args.amount)),
    hexArg(optionalPrincipal(args.token)),
    hexArg(Cl.principal(args.counterparty)),
    hexArg(Cl.uint(args.myBalance)),
    hexArg(Cl.uint(args.theirBalance)),
    hexArg(Cl.bufferFromHex(args.mySig)),
    hexArg(Cl.bufferFromHex(args.theirSig)),
    hexArg(Cl.uint(args.nonce)),
  ];
}

export function getWithdrawContractCallArgs(args: StackflowWithdrawArgs) {
  const { address, name } = splitContractId(args.contractId);
  return {
    contractAddress: address,
    contractName: name,
    functionName: stackflowContractFunctions.withdraw,
    functionArgs: buildWithdrawFunctionArgs(args),
  };
}

export interface StackflowGetPipeReadOnlyArgs {
  contractId: string;
  token: string | null;
  counterparty: string;
  senderAddress: string;
}

export function buildGetPipeFunctionArgs(args: StackflowGetPipeReadOnlyArgs): ClarityValue[] {
  return [optionalPrincipal(args.token), Cl.principal(args.counterparty)];
}

export function getGetPipeReadOnlyCallArgs(
  args: StackflowGetPipeReadOnlyArgs,
  postConditions?: PostConditionWire[]
) {
  const { address, name } = splitContractId(args.contractId);
  return {
    contractAddress: address,
    contractName: name,
    functionName: stackflowContractFunctions.getPipe,
    functionArgs: buildGetPipeFunctionArgs(args),
    senderAddress: args.senderAddress,
    postConditions,
  };
}
