import { type ComputeInstanceCatalogItem } from '@osac/types';

import OsacForm from '../../Form/OsacForm';
import UserDataField from '../../Form/UserDataField';
import ComputeInstanceTypeField from '../../ProvisioningWizard/fields/ComputeInstanceTypeField';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmConfigurationStep = ({ catalogItem }: Props) => {
  if (!catalogItem) {
    return null;
  }

  return (
    <OsacForm>
      <ComputeInstanceTypeField name="spec.instanceType" />
      <UserDataField name="spec.userData" />
    </OsacForm>
  );
};
