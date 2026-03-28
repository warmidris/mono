import { z } from 'zod';

import { defineRpcEndpoint } from '../../rpc/schemas';
import {
  decryptedStructuredMessageSchema,
  stxDecryptMessageParamsSchema,
} from './_encrypted-message';

export const stxDecryptMessage = defineRpcEndpoint({
  method: 'stx_decryptMessage',
  params: stxDecryptMessageParamsSchema,
  result: z.object({
    message: z.string(),
    address: z.string(),
    publicKey: z.string(),
    structuredMessage: decryptedStructuredMessageSchema.optional(),
  }),
});
