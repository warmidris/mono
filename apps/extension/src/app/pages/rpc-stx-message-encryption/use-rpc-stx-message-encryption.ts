import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type DecryptedStructuredMessage,
  type EncryptedMessage,
  RpcErrorCode,
  type RpcRequest,
  createRpcErrorResponse,
  createRpcSuccessResponse,
  stxDecryptMessage,
  stxEncryptMessage,
} from '@leather.io/rpc';

import { decryptStxMessage, encryptStxMessage } from '@shared/crypto/stx-message-encryption';
import { closeWindow } from '@shared/utils';

import { useDefaultRequestParams } from '@app/common/hooks/use-default-request-search-params';
import { initialSearchParams } from '@app/common/initial-search-params';
import { useCurrentStacksAccount } from '@app/store/accounts/blockchain/stacks/stacks-account.hooks';

type Operation = 'encrypt' | 'decrypt';
type EncryptionRequest = RpcRequest<typeof stxEncryptMessage>;
type DecryptionRequest = RpcRequest<typeof stxDecryptMessage>;
type StoredRequest = EncryptionRequest | DecryptionRequest;
interface DecryptedPreview {
  message: string;
  structuredMessage: DecryptedStructuredMessage;
}

function getOperation(value: string | null): Operation | null {
  if (value === 'encrypt' || value === 'decrypt') return value;
  return null;
}

function makeStorageKey(requestId: string) {
  return `stx-message-encryption-request-${requestId}`;
}

export function useRpcStxMessageEncryptionParams() {
  const { origin, tabId } = useDefaultRequestParams();
  const requestId = initialSearchParams.get('requestId');
  const operation = getOperation(initialSearchParams.get('operation'));

  if (!requestId || !origin || !operation) {
    throw new Error('Missing required parameters for Stacks encryption request');
  }

  return useMemo(
    () => ({
      origin,
      tabId: tabId ?? 0,
      requestId,
      operation,
    }),
    [operation, origin, requestId, tabId]
  );
}

async function removeStoredRequest(requestId: string) {
  await chrome.storage.session.remove(makeStorageKey(requestId));
}

function parseDecryptedStructuredMessage(message: string): DecryptedStructuredMessage | null {
  try {
    const parsed: unknown = JSON.parse(message);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (obj.v !== 1 || typeof obj.secret !== 'string' || typeof obj.body !== 'string') {
      return null;
    }
    if (!/^[0-9a-fA-F]{64}$/.test(obj.secret)) return null;
    if (obj.subject !== undefined && typeof obj.subject !== 'string') return null;
    return {
      v: 1,
      secret: obj.secret,
      subject: typeof obj.subject === 'string' ? obj.subject : undefined,
      body: obj.body,
    };
  } catch {
    return null;
  }
}

export function useRpcStxMessageEncryption() {
  const { requestId, operation, tabId } = useRpcStxMessageEncryptionParams();
  const account = useCurrentStacksAccount();
  const [request, setRequest] = useState<StoredRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedPreview, setDecryptedPreview] = useState<DecryptedPreview | null>(null);

  useEffect(() => {
    const key = makeStorageKey(requestId);
    void chrome.storage.session.get(key).then(stored => {
      setRequest((stored[key] as StoredRequest | undefined) ?? null);
    });
  }, [requestId]);

  const respondWithError = useCallback(
    async (method: 'stx_encryptMessage' | 'stx_decryptMessage', code: number, message: string) => {
      if (!tabId) return;
      await removeStoredRequest(requestId);
      void chrome.tabs.sendMessage(
        tabId,
        createRpcErrorResponse(method, {
          id: requestId,
          error: { code, message },
        })
      );
      closeWindow();
    },
    [requestId, tabId]
  );

  const onCancel = useCallback(async () => {
    if (!request) return;
    return respondWithError(request.method, RpcErrorCode.USER_REJECTION, 'User rejected request');
  }, [request, respondWithError]);

  const sendDecryptResponse = useCallback(
    async (message: string, structuredMessage?: DecryptedStructuredMessage) => {
      if (!tabId || !request || request.method !== stxDecryptMessage.method || !account) return;
      void chrome.tabs.sendMessage(
        tabId,
        createRpcSuccessResponse(stxDecryptMessage.method, {
          id: requestId,
          result: {
            message,
            address: account.address,
            publicKey: account.stxPublicKey,
            ...(structuredMessage ? { structuredMessage } : {}),
          },
        })
      );
      await removeStoredRequest(requestId);
      closeWindow();
    },
    [account, request, requestId, tabId]
  );

  const onApprove = useCallback(async () => {
    if (!tabId) return;
    if (!request) {
      return respondWithError(
        'stx_encryptMessage',
        RpcErrorCode.INVALID_REQUEST,
        'Request payload missing'
      );
    }
    if (!account || account.type === 'ledger') {
      return respondWithError(
        request.method,
        RpcErrorCode.INTERNAL_ERROR,
        'Only software Stacks accounts currently support encryption and decryption'
      );
    }

    setIsLoading(true);
    try {
      if (decryptedPreview) {
        await sendDecryptResponse(decryptedPreview.message, decryptedPreview.structuredMessage);
        return;
      }

      if (request.method === stxEncryptMessage.method) {
        const encryptedMessage = await encryptStxMessage(
          request.params.message,
          request.params.publicKey
        );
        void chrome.tabs.sendMessage(
          tabId,
          createRpcSuccessResponse(stxEncryptMessage.method, {
            id: requestId,
            result: {
              encryptedMessage,
              address: account.address,
              publicKey: account.stxPublicKey,
            },
          })
        );
      } else {
        const message = await decryptStxMessage(
          request.params.encryptedMessage,
          account.stxPrivateKey
        );
        const structuredMessage = parseDecryptedStructuredMessage(message);
        if (structuredMessage) {
          setDecryptedPreview({ message, structuredMessage });
          return;
        }
        await sendDecryptResponse(message);
      }

      await removeStoredRequest(requestId);
      closeWindow();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Encryption request failed';
      await respondWithError(request.method, RpcErrorCode.INTERNAL_ERROR, message);
    } finally {
      setIsLoading(false);
    }
  }, [account, decryptedPreview, request, requestId, respondWithError, sendDecryptResponse, tabId]);

  return {
    account,
    decryptedPreview,
    isLoading,
    operation,
    request,
    onApprove,
    onCancel,
  };
}

export function getRequestSummary(request: StoredRequest | null): {
  messageLength?: number;
  publicKey?: string;
  encryptedMessage?: EncryptedMessage;
} {
  if (!request) return {};
  if (request.method === stxEncryptMessage.method) {
    return {
      messageLength: new TextEncoder().encode(request.params.message).length,
      publicKey: request.params.publicKey,
    };
  }
  return { encryptedMessage: request.params.encryptedMessage };
}
