import { Stack, StackItem } from '@patternfly/react-core';

import type { BareMetalInstanceCatalogItem } from '@osac/types';

import { BM_INSTANCE_TYPE_FORM_PATH, BM_USER_DATA_FORM_PATH } from './fields';
import OsacForm from '../../Form/OsacForm';
import UserDataField from '../../Form/UserDataField';
import BareMetalInstanceTypeField from '../../ProvisioningWizard/fields/BareMetalInstanceTypeField';
import DiskImageField from '../../ProvisioningWizard/fields/DiskImageField';

interface Props {
  catalogItem: BareMetalInstanceCatalogItem | null;
}

const BareMetalConfigurationStep = (_props: Props) => (
  <Stack hasGutter>
    <StackItem>
      <OsacForm>
        <BareMetalInstanceTypeField name={BM_INSTANCE_TYPE_FORM_PATH} />
        <DiskImageField name="spec.diskImage" />
        <UserDataField name={BM_USER_DATA_FORM_PATH} />
      </OsacForm>
    </StackItem>
  </Stack>
);

export default BareMetalConfigurationStep;
