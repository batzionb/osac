import { useFormikContext } from 'formik';

import type { ClusterCatalogItem } from '@osac/types';
import ProjectField from '@osac/ui-components/components/Form/ProjectField';

import { CLUSTER_SSH_KEY_FORM_PATH, ClusterWizardValues } from './fields';
import NameField from '../../Form/NameField';
import OsacForm from '../../Form/OsacForm';
import SshKeyField from '../../Form/SshKeyField';
import PullSecretField from '../../ProvisioningWizard/fields/PullSecretField';

interface ClusterGeneralStepProps {
  catalogItem: ClusterCatalogItem | null;
}

const ClusterGeneralStep = (_props: ClusterGeneralStepProps) => {
  const { values, setFieldValue } = useFormikContext<ClusterWizardValues>();

  return (
    <OsacForm>
      <ProjectField onSelect={() => setFieldValue('spec.pullSecretSecret.name', '')} />
      <NameField />
      <SshKeyField name={CLUSTER_SSH_KEY_FORM_PATH} />
      <PullSecretField name="spec.pullSecretSecret.name" project={values.metadata.project} />
    </OsacForm>
  );
};

export default ClusterGeneralStep;
