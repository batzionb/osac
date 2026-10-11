import { useTranslation } from '../../../hooks/useTranslation';
import { InputField } from '../../Form/InputField';

interface ClusterPodCidrFieldProps {
  name: string;
  fieldId?: string;
  isDisabled?: boolean;
}

const ClusterPodCidrField = ({
  name,
  fieldId = 'cluster-pod-cidr',
  isDisabled = false,
}: ClusterPodCidrFieldProps) => {
  const { t } = useTranslation();

  return (
    <InputField
      name={name}
      label={t('Pod CIDR')}
      fieldId={fieldId}
      isDisabled={isDisabled}
      helperText={t('Use IPv4 CIDR notation (for example 10.128.0.0/14).')}
    />
  );
};

export default ClusterPodCidrField;
