import { CATALOG_PROVISION_MULTILINE_TEXTAREA } from './constants';
import { InputField } from './InputField';
import { useTranslation } from '../../hooks/useTranslation';

type UserDataFieldProps = {
  name: string;
};

const UserDataField = ({ name }: UserDataFieldProps) => {
  const { t } = useTranslation();

  return (
    <InputField
      name={name}
      label={t('User data')}
      fieldId="bm-user-data"
      multiline
      rows={CATALOG_PROVISION_MULTILINE_TEXTAREA.rows}
      resizeOrientation={CATALOG_PROVISION_MULTILINE_TEXTAREA.resizeOrientation}
      helperText={t('Optional cloud-init user data (max 64 KB).')}
    />
  );
};

export default UserDataField;
