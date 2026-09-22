import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex } from '@patternfly/react-core';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';
import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import PlayIcon from '@patternfly/react-icons/dist/esm/icons/play-icon';
import StopIcon from '@patternfly/react-icons/dist/esm/icons/stop-icon';
import SyncAltIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState, ExternalIPAttachmentState } from '@osac/types';

import AttachExternalIpModal from './AttachExternalIpModal';
import DetachExternalIpModal from './DetachExternalIpModal';
import VmDeleteConfirmModal from './VmDeleteConfirmModal';
import { useExternalIPAttachments } from '../../../api/v1/external-ip';
import { computeInstanceAttachmentFilter } from '../../../api/v1/external-ip-data';
import { useTranslation } from '../../../hooks/useTranslation';
import { useVmPowerAction } from '../useVmPowerAction';

interface VmDetailsActionButtonsProps {
  vm: ComputeInstance;
}

const VmDetailsActionButtons = ({ vm }: VmDetailsActionButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attachExternalIpOpen, setAttachExternalIpOpen] = useState(false);
  const [detachExternalIpOpen, setDetachExternalIpOpen] = useState(false);
  const { runPowerAction } = useVmPowerAction();
  const { data: externalIpAttachments = [], isLoading: isLoadingExternalIpAttachments } =
    useExternalIPAttachments(
      { filter: computeInstanceAttachmentFilter(vm.id) },
      { enabled: Boolean(vm.status?.externalIpAddress) },
    );

  const state = vm.status?.state;
  const canStart = state === ComputeInstanceState.STOPPED;
  const canStop = state === ComputeInstanceState.RUNNING || state === ComputeInstanceState.PAUSED;
  const canRestart =
    state === ComputeInstanceState.RUNNING || state === ComputeInstanceState.PAUSED;
  const canDelete = state !== ComputeInstanceState.DELETING;
  const canAttachExternalIp =
    state === ComputeInstanceState.RUNNING && !vm.status?.externalIpAddress;
  const externalIpAttachment = externalIpAttachments[0];
  const hasAttachedExternalIp = Boolean(vm.status?.externalIpAddress);
  const isDetachingExternalIp =
    externalIpAttachment?.status?.state ===
    ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_DELETING;

  return (
    <>
      {deleteOpen && (
        <VmDeleteConfirmModal
          vm={vm}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate('/vms')}
        />
      )}
      {attachExternalIpOpen && (
        <AttachExternalIpModal
          vm={vm}
          onClose={() => setAttachExternalIpOpen(false)}
          onSuccess={() => setAttachExternalIpOpen(false)}
        />
      )}
      {detachExternalIpOpen && externalIpAttachment && (
        <DetachExternalIpModal
          attachment={externalIpAttachment}
          externalIpAddress={vm.status?.externalIpAddress}
          onClose={() => setDetachExternalIpOpen(false)}
        />
      )}
      <Flex
        justifyContent={{ default: 'justifyContentFlexEnd' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
      >
        <Button
          variant="primary"
          icon={<PlayIcon />}
          isDisabled={!canStart}
          onClick={() => {
            if (canStart) {
              runPowerAction(vm.id, 'start');
            }
          }}
        >
          Start
        </Button>
        <Button
          variant="secondary"
          icon={<StopIcon />}
          isDisabled={!canStop}
          onClick={() => {
            if (canStop) {
              runPowerAction(vm.id, 'stop');
            }
          }}
        >
          Stop
        </Button>
        <Button
          variant="secondary"
          icon={<SyncAltIcon />}
          isDisabled={!canRestart}
          onClick={() => {
            if (canRestart) {
              runPowerAction(vm.id, 'restart');
            }
          }}
        >
          Restart
        </Button>
        <Button
          variant="secondary"
          icon={<GlobeIcon />}
          isDisabled={
            isLoadingExternalIpAttachments ||
            isDetachingExternalIp ||
            (!hasAttachedExternalIp && !canAttachExternalIp)
          }
          isLoading={isLoadingExternalIpAttachments || isDetachingExternalIp}
          onClick={() => {
            if (hasAttachedExternalIp && externalIpAttachment) {
              setDetachExternalIpOpen(true);
            } else if (canAttachExternalIp) {
              setAttachExternalIpOpen(true);
            }
          }}
        >
          {t(
            isDetachingExternalIp
              ? 'Detaching external IP'
              : hasAttachedExternalIp
                ? 'Detach external IP'
                : 'Attach external IP',
          )}
        </Button>
        <Button
          variant="danger"
          icon={<DumpsterIcon />}
          isDisabled={!canDelete}
          onClick={() => {
            if (canDelete) {
              setDeleteOpen(true);
            }
          }}
        >
          Delete
        </Button>
      </Flex>
    </>
  );
};

export default VmDetailsActionButtons;
