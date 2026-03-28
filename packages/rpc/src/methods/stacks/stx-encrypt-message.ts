import { z } from 'zod';

import { defineRpcEndpoint } from '../../rpc/schemas';
import { encryptedMessageSchema, stxEncryptMessageParamsSchema } from './_encrypted-message';

export const stxEncryptMessage = defineRpcEndpoint({
  method: 'stx_encryptMessage',
  params: stxEncryptMessageParamsSchema,
  result: z.object({
    encryptedMessage: encryptedMessageSchema,
    address: z.string(),
    publicKey: z.string(),
  }),
});
