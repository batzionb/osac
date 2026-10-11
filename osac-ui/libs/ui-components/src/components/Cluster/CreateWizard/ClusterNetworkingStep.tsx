import { FormSection, Stack, StackItem } from '@patternfly/react-core';

import type { ClusterCatalogItem } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { NetworkAttachmentPickers } from '../../Form/NetworkAttachmentPickers';
import OsacForm from '../../Form/OsacForm';
import ClusterPodCidrField from '../../ProvisioningWizard/fields/ClusterPodCidrField';
import ClusterServiceCidrField from '../../ProvisioningWizard/fields/ClusterServiceCidrField';

interface Props {
  catalogItem: ClusterCatalogItem | null;
}

export const ClusterNetworkingStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <OsacForm>
          <FormSection title={t('Infrastructure Networking')} titleElement="h2">
            <NetworkAttachmentPickers
              fieldPrefix="spec.networkAttachment"
              fieldIdPrefix="cluster"
              useDefaultNetworkName="spec.useDefaultNetwork"
              autoExternalIpName="spec.autoExternalIpAttachment"
              autoExternalIpHelperText={t(
                'Automatically provision external IPs for the cluster API and ingress endpoints.',
              )}
            />
          </FormSection>
          <FormSection title={t('Cluster Networking')} titleElement="h2">
            <ClusterPodCidrField name="spec.network.podCidr" />
            <ClusterServiceCidrField name="spec.network.serviceCidr" />
          </FormSection>
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
