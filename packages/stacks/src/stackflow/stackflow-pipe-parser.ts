import { ClarityType, type ClarityValue } from '@stacks/transactions';

import type { StackflowOnChainPipeState } from './stackflow.types';

function isTuple(
  value: ClarityValue
): value is ClarityValue & { type: typeof ClarityType.Tuple; value: Record<string, ClarityValue> } {
  return value.type === ClarityType.Tuple;
}

function getUintString(value: ClarityValue | undefined): string | null {
  if (!value || value.type !== ClarityType.UInt) return null;
  return String((value as ClarityValue & { value: bigint }).value);
}

function getPrincipalString(value: ClarityValue | undefined): string | null {
  if (
    !value ||
    (value.type !== ClarityType.PrincipalStandard && value.type !== ClarityType.PrincipalContract)
  )
    return null;
  return String((value as ClarityValue & { value: string }).value);
}

function parseOptionalPending(
  value: ClarityValue | undefined
): { amount: string; burnHeight: string } | null {
  if (!value || value.type === ClarityType.OptionalNone) return null;
  if (value.type !== ClarityType.OptionalSome) return null;
  const inner = (value as ClarityValue & { value: ClarityValue }).value;
  if (!isTuple(inner)) return null;
  const amount = getUintString(inner.value.amount);
  const burnHeight = getUintString(inner.value['burn-height']);
  if (!amount || !burnHeight) return null;
  return { amount, burnHeight };
}

function parseOptionalPrincipal(value: ClarityValue | undefined): string | null {
  if (!value || value.type === ClarityType.OptionalNone) return null;
  if (value.type !== ClarityType.OptionalSome) return null;
  return getPrincipalString((value as ClarityValue & { value: ClarityValue }).value);
}

function unwrapOptional(cv: ClarityValue): ClarityValue | null {
  if (cv.type === ClarityType.OptionalNone) return null;
  if (cv.type === ClarityType.OptionalSome) {
    return (cv as ClarityValue & { type: typeof ClarityType.OptionalSome; value: ClarityValue })
      .value;
  }
  return cv;
}

export function parseGetPipeResponse(cv: ClarityValue): StackflowOnChainPipeState | null {
  const inner = unwrapOptional(cv);
  if (!inner) return null;
  if (!isTuple(inner)) return null;
  const fields = inner.value;

  const balance1 = getUintString(fields['balance-1']);
  const balance2 = getUintString(fields['balance-2']);
  const nonce = getUintString(fields.nonce);
  const expiresAt = getUintString(fields['expires-at']);

  if (!balance1 || !balance2 || !nonce || !expiresAt) return null;

  return {
    balance1,
    balance2,
    nonce,
    expiresAt,
    closer: parseOptionalPrincipal(fields.closer),
    pending1: parseOptionalPending(fields['pending-1']),
    pending2: parseOptionalPending(fields['pending-2']),
  };
}
