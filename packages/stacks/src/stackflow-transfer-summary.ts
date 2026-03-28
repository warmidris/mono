import { ClarityType, type ClarityValue, cvToString } from '@stacks/transactions';

export interface StackflowTransferSummary {
  contractId: string;
  chainId: string;
  principal1: string;
  principal2: string;
  token: string | null;
  balance1: string;
  balance2: string;
  nonce: string;
  action: string;
  actor: string;
  hashedSecret: string | null;
  validAfter: string | null;
}

function isUint(
  value: ClarityValue
): value is ClarityValue & { type: typeof ClarityType.UInt; value: bigint } {
  return value.type === ClarityType.UInt;
}

function isPrincipal(value: ClarityValue): value is ClarityValue & { value: string } {
  return (
    value.type === ClarityType.PrincipalStandard || value.type === ClarityType.PrincipalContract
  );
}

function isOptionalSome(
  value: ClarityValue
): value is ClarityValue & { type: typeof ClarityType.OptionalSome; value: ClarityValue } {
  return value.type === ClarityType.OptionalSome;
}

function getUintString(value: ClarityValue | undefined): string | null {
  if (!value || !isUint(value)) return null;
  return String(value.value);
}

function getPrincipalString(value: ClarityValue | undefined): string | null {
  if (!value || !isPrincipal(value)) return null;
  return String(value.value);
}

function getOptionalDisplay(value: ClarityValue | undefined): string | null {
  if (!value || typeof value !== 'object') return null;
  if (value.type === ClarityType.OptionalNone) return null;
  if (!isOptionalSome(value)) return null;
  return cvToString(value.value);
}

interface StructuredPayloadLike {
  message: ClarityValue;
  domain: ClarityValue;
}

function isTuple(
  value: ClarityValue
): value is ClarityValue & { type: typeof ClarityType.Tuple; value: Record<string, ClarityValue> } {
  return value.type === ClarityType.Tuple;
}

function isStringASCII(
  value: ClarityValue
): value is ClarityValue & { type: typeof ClarityType.StringASCII; value: string } {
  return value.type === ClarityType.StringASCII;
}

export function parseStackflowTransferSummary(
  payload: StructuredPayloadLike
): StackflowTransferSummary | null {
  if (!isTuple(payload.message) || !isTuple(payload.domain)) return null;
  const domainName = payload.domain.value.name;
  const domainVersion = payload.domain.value.version;
  const domainChainId = payload.domain.value['chain-id'];

  if (!domainName || !isStringASCII(domainName)) return null;
  if (!domainVersion || !isStringASCII(domainVersion)) return null;
  if (!domainChainId || !isUint(domainChainId)) return null;
  if (!domainName.value.includes('.')) return null;

  const fields = payload.message.value;
  const principal1 = getPrincipalString(fields['principal-1']);
  const principal2 = getPrincipalString(fields['principal-2']);
  const balance1 = getUintString(fields['balance-1']);
  const balance2 = getUintString(fields['balance-2']);
  const nonce = getUintString(fields.nonce);
  const action = getUintString(fields.action);
  const actor = getPrincipalString(fields.actor);

  if (!principal1 || !principal2 || !balance1 || !balance2 || !nonce || !action || !actor) {
    return null;
  }

  const tokenField = fields.token;
  let token: string | null = null;
  if (tokenField) {
    if (isOptionalSome(tokenField)) {
      token = getPrincipalString(tokenField.value) ?? cvToString(tokenField.value, 'tryAscii');
    } else if (tokenField.type !== ClarityType.OptionalNone) {
      return null;
    }
  }

  return {
    contractId: domainName.value,
    chainId: String(domainChainId.value),
    principal1,
    principal2,
    token,
    balance1,
    balance2,
    nonce,
    action,
    actor,
    hashedSecret: getOptionalDisplay(fields['hashed-secret']),
    validAfter: getOptionalDisplay(fields['valid-after']),
  };
}

export function getActionLabel(summary: StackflowTransferSummary): string {
  if (summary.action === '1' && summary.hashedSecret) return 'HTLC Payment';
  if (summary.action === '1') return 'Transfer';
  if (summary.action === '2') {
    return summary.actor === summary.contractId ? 'Deposit' : 'Withdraw';
  }
  return `Action ${summary.action}`;
}
