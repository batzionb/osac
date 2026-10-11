import { AdditionalDisksArrayField } from './AdditionalDisksArrayField';
import { useTranslation } from '../../../hooks/useTranslation';
import { InputField } from '../../Form/InputField';
import OsacForm from '../../Form/OsacForm';
import { StorageTierSelectField } from '../../Form/StorageTierSelectField';
export const VmStorageStep = () => {
  const { t } = useTranslation();

  return (
    <OsacForm>
      <InputField
        name="spec.bootDisk.sizeGib"
        label={t('Boot disk')}
        fieldId="vm-boot-disk-size"
        type="number"
        isRequired
        helperText={t('Size in GiB')}
      />
      <StorageTierSelectField
        name="spec.bootDisk.storageTier"
        label={t('Storage tier')}
        fieldId="vm-boot-disk-storage-tier"
      />
      <AdditionalDisksArrayField />
    </OsacForm>
  );
};
