import { Stack, StackItem, Title } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';
import { InputField } from '../Form/InputField';
import OsacForm from '../Form/OsacForm';
import NameField from '../ProvisioningWizard/NameField';

const GeneralStep = () => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('General')}
        </Title>
      </StackItem>
      <StackItem>
        <OsacForm>
          <NameField />
          <InputField
            name="metadata.description"
            label={t('Description')}
            fieldId="metadata-description"
            multiline
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};

export default GeneralStep;
