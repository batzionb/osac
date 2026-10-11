import { useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';
import ProjectField from '@osac/ui-components/components/Form/ProjectField';

import {
  ComputeInstanceWizardValues,
  VM_SSH_KEY_FORM_PATH,
  VM_USER_DATA_SECRET_FORM_PATH,
} from './fields';
import NameField from '../../Form/NameField';
import OsacForm from '../../Form/OsacForm';
import SshPublicKeySecretField from '../../ProvisioningWizard/fields/SshPublicKeySecretField';

interface VmGeneralStepProps {
  catalogItem: ComputeInstanceCatalogItem | null;
}

const VmGeneralStep = ({ catalogItem }: VmGeneralStepProps) => {
  const isSshKeyLocked = catalogItem?.fields?.sshKey?.behavior.case === 'locked';
  const { values, setFieldValue } = useFormikContext<ComputeInstanceWizardValues>();

  return (
    <OsacForm>
      <ProjectField
        onSelect={() => {
          void setFieldValue(VM_SSH_KEY_FORM_PATH, '');
          void setFieldValue(VM_USER_DATA_SECRET_FORM_PATH, '');
        }}
      />
      <NameField />
      <SshPublicKeySecretField
        name={VM_SSH_KEY_FORM_PATH}
        project={values.metadata.project}
        isDisabled={isSshKeyLocked}
      />
    </OsacForm>
  );
};

export default VmGeneralStep;
