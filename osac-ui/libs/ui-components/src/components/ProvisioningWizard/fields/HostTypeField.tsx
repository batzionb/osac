import { useMemo } from 'react';

import { hostTypeDisplayName, useHostTypes } from '../../../api/v1/host-types';
import { useTranslation } from '../../../hooks/useTranslation';
import { SelectField } from '../../Form/SelectField';

interface HostTypeFieldProps {
  name: string;
  fieldId: string;
  isDisabled?: boolean;
}

const HostTypeField = ({ name, fieldId, isDisabled = false }: HostTypeFieldProps) => {
  const { t } = useTranslation();
  const { data: hostTypes = [], isLoading } = useHostTypes();

  const hostTypeOptions = useMemo(
    () =>
      hostTypes.map((hostType) => ({
        value: hostType.id,
        label: hostTypeDisplayName(hostType),
      })),
    [hostTypes],
  );

  return (
    <SelectField
      name={name}
      label={t('Host type')}
      fieldId={fieldId}
      options={hostTypeOptions}
      isRequired
      isDisabled={isDisabled}
      isLoading={isLoading}
      placeholder={t('Select host type')}
    />
  );
};

export default HostTypeField;
