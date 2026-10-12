import { Stack, StackItem } from '@patternfly/react-core';

import type { BareMetalInstanceCatalogItem } from '@osac/types';

import {
  BM_DISK_IMAGE_FORM_PATH,
  BM_INSTANCE_TYPE_FORM_PATH,
  BM_USER_DATA_FORM_PATH,
} from './fields';
import OsacForm from '../../Form/OsacForm';
import UserDataField from '../../Form/UserDataField';
import BareMetalInstanceTypeField from '../../ProvisioningWizard/fields/BareMetalInstanceTypeField';
import DiskImageField from '../../ProvisioningWizard/fields/DiskImageField';
import ProvisioningField from '../../ProvisioningWizard/fields/ProvisioningField';

interface Props {
  catalogItem: BareMetalInstanceCatalogItem | null;
}

const BareMetalConfigurationStep = (_props: Props) => (
  <Stack hasGutter>
    <StackItem>
      <OsacForm>
        <ProvisioningField name={BM_INSTANCE_TYPE_FORM_PATH}>
          {({ valueName, isDisabled }) => (
            <BareMetalInstanceTypeField name={valueName} isDisabled={isDisabled} />
          )}
        </ProvisioningField>
        <ProvisioningField name={BM_DISK_IMAGE_FORM_PATH}>
          {({ valueName, isDisabled }) => (
            <DiskImageField name={valueName} isDisabled={isDisabled} />
          )}
        </ProvisioningField>
        <ProvisioningField name={BM_USER_DATA_FORM_PATH}>
          {({ valueName, isDisabled }) => (
            <UserDataField name={valueName} isDisabled={isDisabled} />
          )}
        </ProvisioningField>
      </OsacForm>
    </StackItem>
  </Stack>
);

export default BareMetalConfigurationStep;
