import {
  RpcErrorCode,
  createRpcErrorResponse,
  stxDecryptMessage,
  stxEncryptMessage,
} from '@leather.io/rpc';

import { RouteUrls } from '@shared/route-urls';
import {
  getRpcParamErrorsFormatted,
  validateRpcParams,
} from '@shared/rpc/methods/validation.utils';

import { trackRpcRequestError, trackRpcRequestSuccess } from '../rpc-helpers';
import { defineRpcRequestHandler } from '../rpc-message-handler';
import {
  type RequestParams,
  createConnectingAppSearchParamsWithLastKnownAccount,
  getTabIdFromPort,
  triggerRequestPopupWindowOpen,
} from '../rpc-request-utils';

function makeStorageKey(requestId: string) {
  return `stx-message-encryption-request-${requestId}`;
}

async function persistRequest(request: { id: string }) {
  await chrome.storage.session.set({ [makeStorageKey(request.id)]: request });
}

async function clearPersistedRequest(requestId: string) {
  await chrome.storage.session.remove(makeStorageKey(requestId));
}

async function openCryptoPopup(
  request: { id: string; method: 'stx_encryptMessage' | 'stx_decryptMessage' },
  port: chrome.runtime.Port,
  operation: 'encrypt' | 'decrypt'
) {
  await persistRequest(request);
  void trackRpcRequestSuccess({ endpoint: request.method });

  const requestParams: RequestParams = [
    ['requestId', request.id],
    ['operation', operation],
  ];
  const { urlParams, tabId } = await createConnectingAppSearchParamsWithLastKnownAccount(
    port,
    requestParams
  );
  const { id } = await triggerRequestPopupWindowOpen(RouteUrls.RpcStxMessageEncryption, urlParams);

  function onPopupClose(closedWindowId: number) {
    if (closedWindowId !== id) return;
    chrome.windows.onRemoved.removeListener(onPopupClose);
    void clearPersistedRequest(request.id);
    if (!tabId) return;
    void chrome.tabs.sendMessage(
      tabId,
      createRpcErrorResponse(request.method, {
        id: request.id,
        error: {
          code: RpcErrorCode.USER_REJECTION,
          message: 'User rejected request',
        },
      })
    );
  }

  chrome.windows.onRemoved.addListener(onPopupClose);
}

export const stxEncryptMessageHandler = defineRpcRequestHandler(
  stxEncryptMessage.method,
  async (request, port) => {
    if (!validateRpcParams(request.params, stxEncryptMessage.params)) {
      void trackRpcRequestError({ endpoint: request.method, error: 'Invalid parameters' });
      void chrome.tabs.sendMessage(
        getTabIdFromPort(port),
        createRpcErrorResponse(request.method, {
          id: request.id,
          error: {
            code: RpcErrorCode.INVALID_PARAMS,
            message: getRpcParamErrorsFormatted(request.params, stxEncryptMessage.params),
          },
        })
      );
      return;
    }

    return openCryptoPopup(request, port, 'encrypt');
  }
);

export const stxDecryptMessageHandler = defineRpcRequestHandler(
  stxDecryptMessage.method,
  async (request, port) => {
    if (!validateRpcParams(request.params, stxDecryptMessage.params)) {
      void trackRpcRequestError({ endpoint: request.method, error: 'Invalid parameters' });
      void chrome.tabs.sendMessage(
        getTabIdFromPort(port),
        createRpcErrorResponse(request.method, {
          id: request.id,
          error: {
            code: RpcErrorCode.INVALID_PARAMS,
            message: getRpcParamErrorsFormatted(request.params, stxDecryptMessage.params),
          },
        })
      );
      return;
    }

    return openCryptoPopup(request, port, 'decrypt');
  }
);
