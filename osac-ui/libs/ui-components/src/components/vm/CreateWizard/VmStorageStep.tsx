import { AdditionalDisksArrayField } from './AdditionalDisksArrayField';
import { useTranslation } from '../../../hooks/useTranslation';
import OsacForm from '../../Form/OsacForm';
import { StorageTierSelectField } from '../../Form/StorageTierSelectField';
import BootDiskSizeField from '../../ProvisioningWizard/fields/BootDiskSizeField';

export const VmStorageStep = () => {
  const { t } = useTranslation();

  return (
    <OsacForm>
      <BootDiskSizeField name="spec.bootDisk.sizeGib" />
      <StorageTierSelectField
        name="spec.bootDisk.storageTier"
        label={t('Storage tier')}
        fieldId="vm-boot-disk-storage-tier"
      />
      <AdditionalDisksArrayField />
    </OsacForm>
  );
};
