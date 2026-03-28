export interface StackflowContractInfo {
  contractId: string;
  version: string;
  description: string;
}

const stackflowKnownContracts: StackflowContractInfo[] = [
  {
    contractId: 'SP126XFZQ3ZHYM6Q6KAQZMMJSDY91A8BTT6AD08RV.stackflow-0-6-0',
    version: '0.6.0',
    description: 'StackFlow STX payment channels',
  },
  {
    contractId: 'SP126XFZQ3ZHYM6Q6KAQZMMJSDY91A8BTT6AD08RV.stackflow-sbtc-0-6-0',
    version: '0.6.0',
    description: 'StackFlow sBTC payment channels',
  },
  {
    contractId: 'SP126XFZQ3ZHYM6Q6KAQZMMJSDY91A8BTT6AD08RV.stackflow-token-0-6-0',
    version: '0.6.0',
    description: 'StackFlow SIP-010 token payment channels',
  },
];

export function getStackflowKnownContracts(): StackflowContractInfo[] {
  return stackflowKnownContracts;
}

export function isKnownStackflowContract(contractId: string): boolean {
  return stackflowKnownContracts.some(c => c.contractId === contractId);
}

export function splitContractId(contractId: string): { address: string; name: string } {
  const [address, name] = contractId.split('.');
  if (!address || !name) throw new Error(`Invalid contract ID: ${contractId}`);
  return { address, name };
}
