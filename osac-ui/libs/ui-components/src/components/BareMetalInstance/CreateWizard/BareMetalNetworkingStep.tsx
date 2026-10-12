import { Stack, StackItem } from '@patternfly/react-core';

import type { BareMetalInstanceCatalogItem } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import OsacForm from '../../Form/OsacForm';
import NetworkAttachmentFields from '../../ProvisioningWizard/fields/NetworkAttachmentFields';

interface Props {
  catalogItem: BareMetalInstanceCatalogItem | null;
}

export const BareMetalNetworkingStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <OsacForm>
          <NetworkAttachmentFields
            useDefaultNetworkName="spec.networking.useDefaults"
            virtualNetworkName="spec.networking.attachments.0.virtualNetwork"
            subnetName="spec.networking.attachments.0.subnet"
            securityGroupsName="spec.networking.attachments.0.securityGroups"
            autoExternalIpName="spec.networking.attachExternalIp"
            fieldIdPrefix="bm-attachment-0"
            autoExternalIpHelperText={t(
              'The system will auto-create an ExternalIP and ExternalIPAttachment bound to the primary attachment. Auto-created resources are deleted when the instance is deleted.',
            )}
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
