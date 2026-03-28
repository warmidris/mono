import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { getPublicKey, getSharedSecret, utils } from '@noble/secp256k1';

import type { EncryptedMessage } from '@leather.io/rpc';

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function normalizePrivateKey(key: string): Uint8Array {
  const bytes = hexToBytes(key);
  // Stacks "compressed" private keys have a trailing 0x01 byte (33 bytes)
  if (bytes.length === 33 && bytes[32] === 0x01) return bytes.subarray(0, 32);
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function deriveKey(sharedX: Uint8Array): Uint8Array<ArrayBuffer> {
  const derived = hkdf(sha256, sharedX, 'stx-ecies-v1', 'encrypt', 32);
  return new Uint8Array(derived);
}

export async function encryptStxMessage(
  message: string,
  recipientPublicKey: string
): Promise<EncryptedMessage> {
  const recipientPub = hexToBytes(recipientPublicKey);
  const ephPriv = utils.randomPrivateKey();
  const epk = bytesToHex(getPublicKey(ephPriv, true));

  const shared = getSharedSecret(ephPriv, recipientPub);
  const sharedX = shared.subarray(1);
  const aesKey = deriveKey(sharedX);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);

  const cryptoKey = await crypto.subtle.importKey('raw', aesKey, 'AES-GCM', false, ['encrypt']);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);

  return {
    v: 1,
    epk,
    iv: bytesToHex(iv),
    data: bytesToHex(new Uint8Array(ciphertext)),
  };
}

export async function decryptStxMessage(
  encryptedMessage: EncryptedMessage,
  privateKey: string
): Promise<string> {
  const privKey = normalizePrivateKey(privateKey);
  const epk = hexToBytes(encryptedMessage.epk);

  const shared = getSharedSecret(privKey, epk);
  const sharedX = shared.subarray(1);
  const aesKey = deriveKey(sharedX);

  const iv = new Uint8Array(hexToBytes(encryptedMessage.iv));
  const ciphertext = new Uint8Array(hexToBytes(encryptedMessage.data));

  const cryptoKey = await crypto.subtle.importKey('raw', aesKey, 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);

  return new TextDecoder().decode(plaintext);
}
