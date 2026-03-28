import { stxDecryptMessage } from './stx-decrypt-message';
import { stxEncryptMessage } from './stx-encrypt-message';

describe('Stacks encryption RPC schemas', () => {
  test('stx_encryptMessage accepts a plaintext and compressed public key', () => {
    const result = stxEncryptMessage.params.safeParse({
      message: 'hello world',
      publicKey: '0329b076bc20f7b1592b2a1a5cb91dfefe8c966e50e256458e23dd2c5d63f8f1af',
    });
    expect(result.success).toBe(true);
  });

  test('stx_decryptMessage accepts an ECIES envelope', () => {
    const result = stxDecryptMessage.params.safeParse({
      encryptedMessage: {
        v: 1,
        epk: '0329b076bc20f7b1592b2a1a5cb91dfefe8c966e50e256458e23dd2c5d63f8f1af',
        iv: '0123456789abcdef01234567',
        data: 'deadbeefcafebabe',
      },
    });
    expect(result.success).toBe(true);
  });
});
