import { Stack, styled } from 'leather-styles/jsx';

import { Button, Flag } from '@leather.io/ui';

import { closeWindow } from '@shared/utils';

import { useOnOriginTabClose } from '@app/routes/hooks/use-on-tab-closed';

import { addPortSuffix, getUrlHostname } from '../../common/utils';
import { Favicon } from '../../components/favicon';
import { PopupHeader } from '../../features/container/headers/popup.header';
import { MessageSigningRequestLayout } from '../../features/message-signer/message-signing-request.layout';
import { useCurrentNetworkState } from '../../store/networks/networks.hooks';
import {
  getRequestSummary,
  useRpcStxMessageEncryption,
  useRpcStxMessageEncryptionParams,
} from './use-rpc-stx-message-encryption';

function RpcRequestHeader({
  origin,
  operation,
}: {
  origin: string;
  operation: 'encrypt' | 'decrypt';
}) {
  const { chain, isTestnet } = useCurrentNetworkState();
  const hostname = getUrlHostname(origin);
  const testnetAddition = isTestnet
    ? ` using ${getUrlHostname(chain.stacks.url)}${addPortSuffix(chain.stacks.url)}`
    : '';

  return (
    <Stack gap="space.04" pt="space.05">
      <styled.h1 textStyle="heading.03">
        {operation === 'encrypt' ? 'Encrypt message' : 'Decrypt message'}
      </styled.h1>
      <Flag img={<Favicon origin={origin} />} pl="space.02" width="100%">
        <styled.span textStyle="label.02" wordBreak="break-word">
          {`Requested by ${origin} (${hostname})${testnetAddition}`}
        </styled.span>
      </Flag>
    </Stack>
  );
}

function truncateMiddle(value: string, prefix = 12, suffix = 10) {
  if (value.length <= prefix + suffix + 3) return value;
  return `${value.slice(0, prefix)}...${value.slice(-suffix)}`;
}

export function RpcStxMessageEncryption() {
  const { origin, operation } = useRpcStxMessageEncryptionParams();
  const { account, decryptedPreview, isLoading, request, onApprove, onCancel } =
    useRpcStxMessageEncryption();
  const summary = getRequestSummary(request);
  const accountUnsupported = !account || account.type === 'ledger';

  useOnOriginTabClose(() => closeWindow());

  return (
    <>
      <PopupHeader showSwitchAccount balance="stx" />
      <MessageSigningRequestLayout>
        <RpcRequestHeader origin={origin} operation={operation} />

        <Stack
          gap="space.04"
          borderWidth="1px"
          borderColor="ink.border-default"
          borderRadius="md"
          p="space.05"
        >
          <styled.div textStyle="label.02" color="ink.text-subdued">
            Active account
          </styled.div>
          <styled.div textStyle="body.02">
            {account?.address ?? 'No Stacks account selected'}
          </styled.div>
          {account?.stxPublicKey && (
            <styled.div textStyle="caption.01" color="ink.text-subdued">
              {truncateMiddle(account.stxPublicKey, 18, 14)}
            </styled.div>
          )}
        </Stack>

        {request ? (
          <Stack
            gap="space.04"
            borderWidth="1px"
            borderColor="ink.border-default"
            borderRadius="md"
            p="space.05"
          >
            {operation === 'encrypt' && (
              <>
                <styled.div textStyle="label.02" color="ink.text-subdued">
                  Recipient public key
                </styled.div>
                <styled.div textStyle="body.02">
                  {summary.publicKey ? truncateMiddle(summary.publicKey, 18, 14) : 'Unknown'}
                </styled.div>
                <styled.div textStyle="label.02" color="ink.text-subdued">
                  Plaintext bytes
                </styled.div>
                <styled.div textStyle="body.02">{summary.messageLength ?? 0}</styled.div>
              </>
            )}

            {operation === 'decrypt' && (
              <>
                <styled.div textStyle="label.02" color="ink.text-subdued">
                  Ephemeral public key
                </styled.div>
                <styled.div textStyle="body.02">
                  {summary.encryptedMessage?.epk
                    ? truncateMiddle(summary.encryptedMessage.epk, 18, 14)
                    : 'Unknown'}
                </styled.div>
                <styled.div textStyle="label.02" color="ink.text-subdued">
                  Ciphertext bytes
                </styled.div>
                <styled.div textStyle="body.02">
                  {summary.encryptedMessage
                    ? Math.floor(summary.encryptedMessage.data.length / 2)
                    : 0}
                </styled.div>
              </>
            )}
          </Stack>
        ) : (
          <styled.div textStyle="body.02" color="ink.text-subdued">
            Loading request details...
          </styled.div>
        )}

        {operation === 'decrypt' && decryptedPreview && (
          <Stack
            gap="space.04"
            borderWidth="1px"
            borderColor="green.border-subdued"
            borderRadius="md"
            p="space.05"
            bg="green.background-subdued"
          >
            <styled.div textStyle="label.02" color="ink.text-subdued">
              Decrypted message
            </styled.div>
            <styled.div textStyle="label.02" color="ink.text-subdued">
              Subject
            </styled.div>
            <styled.div textStyle="body.02">
              {decryptedPreview.structuredMessage.subject?.trim() || 'No subject'}
            </styled.div>
            <styled.div textStyle="label.02" color="ink.text-subdued">
              Body
            </styled.div>
            <styled.div textStyle="body.02" whiteSpace="pre-wrap">
              {decryptedPreview.structuredMessage.body}
            </styled.div>
            <styled.div textStyle="caption.01" color="ink.text-subdued">
              This message includes a payment secret that will be shared with the requesting app if
              you continue.
            </styled.div>
          </Stack>
        )}

        {accountUnsupported && (
          <styled.div textStyle="body.02" color="red.action-primary-default">
            Encryption and decryption currently require a software Stacks account. Switch away from
            Ledger to continue.
          </styled.div>
        )}

        <Stack flexDirection="row" gap="space.04">
          <Button onClick={() => void onCancel()} variant="outline" width="50%">
            Cancel
          </Button>
          <Button
            aria-busy={isLoading}
            disabled={!request || accountUnsupported}
            onClick={() => void onApprove()}
            width="50%"
          >
            {operation === 'encrypt' && 'Encrypt'}
            {operation === 'decrypt' && (decryptedPreview ? 'Share with app' : 'Decrypt')}
          </Button>
        </Stack>
      </MessageSigningRequestLayout>
    </>
  );
}
