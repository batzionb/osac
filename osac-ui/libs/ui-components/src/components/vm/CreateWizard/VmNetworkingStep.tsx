import { Stack, StackItem } from '@patternfly/react-core';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import OsacForm from '../../Form/OsacForm';
import NetworkAttachmentFields from '../../ProvisioningWizard/fields/NetworkAttachmentFields';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmNetworkingStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <OsacForm>
          <NetworkAttachmentFields
            useDefaultNetworkName="spec.networking.useDefaultNetwork"
            virtualNetworkName="spec.networking.virtualNetwork"
            subnetName="spec.networking.subnet"
            securityGroupsName="spec.networking.securityGroups"
            autoExternalIpName="spec.networking.autoExternalIpAttachment"
            fieldIdPrefix="vm"
            autoExternalIpHelperText={t(
              'Automatically provision an external IP for this virtual machine.',
            )}
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
