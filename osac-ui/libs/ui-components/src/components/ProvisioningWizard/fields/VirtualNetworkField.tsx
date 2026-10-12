import { useFormikContext } from 'formik';

import { VirtualNetworks } from '@osac/types';

import type { ProvisioningFieldControlProps, ProvisioningFieldValue } from './provisioningFieldValue';
import { provisioningFieldValue } from './provisioningFieldValue';
import { VIRTUAL_NETWORK_READY_LIST_FILTER } from '../../../api/v1/networking';
import { useTranslation } from '../../../hooks/useTranslation';
import { ResourceSelectField } from '../../Form/ResourceSelectField';
import type { ResourceSelectValue } from '../../Form/resourceSelectValue';
import { emptyResourceSelectValue } from '../../Form/resourceSelectValue';

interface VirtualNetworkFieldProps extends ProvisioningFieldControlProps {
  fieldId?: string;
  subnetName: string;
  securityGroupsName: string;
}

const VirtualNetworkField = ({
  name = '',
  fieldId = 'virtual-network',
  subnetName,
  securityGroupsName,
  isDisabled = false,
}: VirtualNetworkFieldProps) => {
  const { t } = useTranslation();
  const { getFieldProps, setFieldValue } = useFormikContext();

  return (
    <ResourceSelectField
      name={name}
      label={t('Virtual network')}
      fieldId={fieldId}
      service={VirtualNetworks}
      request={{ filter: VIRTUAL_NETWORK_READY_LIST_FILTER }}
      autoSelectSingleOption
      isDisabled={isDisabled}
      placeholder={t('Select virtual network')}
      loadErrorTitle={t('Could not load virtual networks')}
      onSelectResource={() => {
        const subnet = getFieldProps<ProvisioningFieldValue<ResourceSelectValue>>(subnetName).value;
        const securityGroups =
          getFieldProps<ProvisioningFieldValue<ResourceSelectValue[]>>(securityGroupsName).value;
        void setFieldValue(
          subnetName,
          provisioningFieldValue(emptyResourceSelectValue(), Boolean(subnet?.locked)),
        );
        void setFieldValue(
          securityGroupsName,
          provisioningFieldValue([], Boolean(securityGroups?.locked)),
        );
      }}
    />
  );
};

export default VirtualNetworkField;
