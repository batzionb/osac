import type { BareMetalInstanceCatalogItem } from '@osac/types';
import ProjectField from '@osac/ui-components/components/Form/ProjectField';

import { BM_SSH_KEY_FORM_PATH } from './fields';
import NameField from '../../Form/NameField';
import OsacForm from '../../Form/OsacForm';
import SshKeyField from '../../Form/SshKeyField';
import ProvisioningField from '../../ProvisioningWizard/fields/ProvisioningField';

interface BareMetalGeneralStepProps {
  catalogItem: BareMetalInstanceCatalogItem | null;
}

const BareMetalGeneralStep = (_props: BareMetalGeneralStepProps) => (
  <OsacForm>
    <ProjectField />
    <NameField />
    <ProvisioningField name={BM_SSH_KEY_FORM_PATH}>
      {({ valueName, isDisabled }) => (
        <SshKeyField name={valueName} isDisabled={isDisabled} />
      )}
    </ProvisioningField>
  </OsacForm>
);

export default BareMetalGeneralStep;
