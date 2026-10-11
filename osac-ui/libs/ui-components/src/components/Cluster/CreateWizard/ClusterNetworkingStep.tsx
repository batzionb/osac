import { FormSection, Stack, StackItem } from '@patternfly/react-core';

import type { ClusterCatalogItem } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { InputField } from '../../Form/InputField';
import { NetworkAttachmentPickers } from '../../Form/NetworkAttachmentPickers';
import OsacForm from '../../Form/OsacForm';

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
            <InputField
              name="spec.network.podCidr"
              label={t('Pod CIDR')}
              fieldId="cluster-pod-cidr"
              helperText={t('Use IPv4 CIDR notation (for example 10.128.0.0/14).')}
            />
            <InputField
              name="spec.network.serviceCidr"
              label={t('Service CIDR')}
              fieldId="cluster-service-cidr"
              helperText={t('Use IPv4 CIDR notation (for example 172.30.0.0/16).')}
            />
          </FormSection>
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
