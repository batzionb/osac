import { useTranslation } from '../../../hooks/useTranslation';
import { InputField } from '../../Form/InputField';

interface ClusterServiceCidrFieldProps {
  name: string;
  fieldId?: string;
  isDisabled?: boolean;
}

const ClusterServiceCidrField = ({
  name,
  fieldId = 'cluster-service-cidr',
  isDisabled = false,
}: ClusterServiceCidrFieldProps) => {
  const { t } = useTranslation();

  return (
    <InputField
      name={name}
      label={t('Service CIDR')}
      fieldId={fieldId}
      isDisabled={isDisabled}
      helperText={t('Use IPv4 CIDR notation (for example 172.30.0.0/16).')}
    />
  );
};

export default ClusterServiceCidrField;
