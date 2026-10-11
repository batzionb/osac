import { useFormikContext } from 'formik';

import { type ClusterCatalogItem, Secret, SecretType } from '@osac/types';
import { cel } from '@osac/ui-components/api/cel';
import ProjectField from '@osac/ui-components/components/Form/ProjectField';
import SecretSelectionField from '@osac/ui-components/components/Form/SecretSelectionField';

import { CLUSTER_SSH_KEY_FORM_PATH, ClusterWizardValues } from './fields';
import { useTranslation } from '../../../hooks/useTranslation';
import NameField from '../../Form/NameField';
import OsacForm from '../../Form/OsacForm';
import SshKeyField from '../../Form/SshKeyField';

interface ClusterGeneralStepProps {
  catalogItem: ClusterCatalogItem | null;
}

const ClusterGeneralStep = (_props: ClusterGeneralStepProps) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ClusterWizardValues>();

  return (
    <OsacForm>
      <ProjectField onSelect={() => setFieldValue('spec.pullSecretSecret.name', '')} />
      <NameField />
      <SshKeyField name={CLUSTER_SSH_KEY_FORM_PATH} />
      <SecretSelectionField
        filter={cel<Secret>((filter) =>
          filter.and(
            filter.field('metadata.project').equals(values.metadata.project),
            filter.field('type').equals(SecretType.PULL_SECRET),
          ),
        )}
        label={t('Pull secret')}
        name="spec.pullSecretSecret.name"
        isRequired
      />
    </OsacForm>
  );
};

export default ClusterGeneralStep;
