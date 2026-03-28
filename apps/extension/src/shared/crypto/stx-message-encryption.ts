import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { getPublicKey, getSharedSecret, utils } from '@noble/secp256k1';

import type { EncryptedMessage } from '@leather.io/rpc';

function stripHexPrefix(value: string) {
  return value.startsWith('0x') || value.startsWith('0X') ? value.slice(2) : value;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = stripHexPrefix(hex);
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
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
  const recipientPub = stripHexPrefix(recipientPublicKey);
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
  const privKey = stripHexPrefix(privateKey);
  const epk = stripHexPrefix(encryptedMessage.epk);

  const shared = getSharedSecret(privKey, epk);
  const sharedX = shared.subarray(1);
  const aesKey = deriveKey(sharedX);

  const iv = new Uint8Array(hexToBytes(encryptedMessage.iv));
  const ciphertext = new Uint8Array(hexToBytes(encryptedMessage.data));

  const cryptoKey = await crypto.subtle.importKey('raw', aesKey, 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);

  return new TextDecoder().decode(plaintext);
}
