import { type ComputeInstanceCatalogItem } from '@osac/types';

import OsacForm from '../../Form/OsacForm';
import UserDataField from '../../Form/UserDataField';
import ComputeInstanceTypeField from '../../ProvisioningWizard/fields/ComputeInstanceTypeField';
import ProvisioningField from '../../ProvisioningWizard/fields/ProvisioningField';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmConfigurationStep = ({ catalogItem }: Props) => {
  if (!catalogItem) {
    return null;
  }

  return (
    <OsacForm>
      <ProvisioningField name="spec.instanceType">
        {({ valueName, isDisabled }) => (
          <ComputeInstanceTypeField name={valueName} isDisabled={isDisabled} />
        )}
      </ProvisioningField>
      <ProvisioningField name="spec.userData">
        {({ valueName, isDisabled }) => (
          <UserDataField name={valueName} isDisabled={isDisabled} />
        )}
      </ProvisioningField>
    </OsacForm>
  );
};
