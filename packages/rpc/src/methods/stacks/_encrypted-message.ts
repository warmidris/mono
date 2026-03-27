import { z } from 'zod';

const compressedPublicKeySchema = z
  .string()
  .regex(/^(0x)?(02|03)[0-9a-fA-F]{64}$/, 'Expected a compressed secp256k1 public key');

export const encryptedMessageSchema = z.object({
  v: z.literal(1),
  epk: compressedPublicKeySchema,
  iv: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Expected a 12-byte IV hex string'),
  data: z.string().regex(/^[0-9a-fA-F]+$/, 'Expected hex-encoded ciphertext'),
});

export const decryptedStructuredMessageSchema = z.object({
  v: z.literal(1),
  secret: z.string().regex(/^[0-9a-fA-F]{64}$/, 'Expected a 32-byte secret hex string'),
  subject: z.string().optional(),
  body: z.string(),
});

export const stxEncryptMessageParamsSchema = z.object({
  message: z.string(),
  publicKey: compressedPublicKeySchema,
});

export const stxDecryptMessageParamsSchema = z.object({
  encryptedMessage: encryptedMessageSchema,
});

export type EncryptedMessage = z.infer<typeof encryptedMessageSchema>;
export type DecryptedStructuredMessage = z.infer<typeof decryptedStructuredMessageSchema>;
export type StxEncryptMessageParams = z.infer<typeof stxEncryptMessageParamsSchema>;
export type StxDecryptMessageParams = z.infer<typeof stxDecryptMessageParamsSchema>;
