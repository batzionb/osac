import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ComputeInstanceCatalogItem, ComputeInstanceSchema } from '@osac/types';
import { ComputeInstanceRunStrategy } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import { type ResourceSelectValue, emptyResourceSelectValue } from '../../Form/resourceSelectValue';

export const createEmptyComputeInstanceValues = (): ComputeInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '', project: '' },
  spec: {
    sshKey: { name: '' },
    instanceType: '',
    userDataSource: 'inline',
    userData: '',
    userDataSecret: { name: '' },
    bootDisk: { sizeGib: '', storageTier: emptyResourceSelectValue() },
    additionalDisks: [],
    networking: {
      useDefaultNetwork: true,
      virtualNetwork: emptyResourceSelectValue(),
      subnet: emptyResourceSelectValue(),
      securityGroups: [],
      autoExternalIpAttachment: false,
    },
  },
});

export const getComputeInstanceInitialValues = (
  catalogItem?: ComputeInstanceCatalogItem,
): ComputeInstanceWizardValues => {
  const values = createEmptyComputeInstanceValues();
  if (!catalogItem) {
    return values;
  }
  const fields = catalogItem.fields;
  const stringValue = (value: string | number | undefined): string =>
    value === undefined ? '' : String(value);
  const value =
    fields?.bootDisk?.sizeGib?.behavior.case === 'editable'
      ? fields.bootDisk.sizeGib.behavior.value.defaultValue
      : fields?.bootDisk?.sizeGib?.behavior.case === 'locked'
        ? fields.bootDisk.sizeGib.behavior.value
        : undefined;
  const storageTier =
    fields?.bootDisk?.storageTier?.behavior.case === 'editable'
      ? fields.bootDisk.storageTier.behavior.value.defaultValue
      : fields?.bootDisk?.storageTier?.behavior.case === 'locked'
        ? fields.bootDisk.storageTier.behavior.value
        : undefined;
  const tier =
    typeof storageTier === 'string'
      ? { id: '', name: storageTier }
      : storageTier && typeof storageTier === 'object' && !Array.isArray(storageTier)
        ? {
            id:
              typeof (storageTier as { id?: unknown }).id === 'string'
                ? (storageTier as { id: string }).id
                : '',
            name:
              typeof (storageTier as { name?: unknown }).name === 'string'
                ? (storageTier as { name: string }).name
                : '',
          }
        : values.spec.bootDisk.storageTier;
  const additional =
    fields?.additionalDisks?.behavior.case === 'editable'
      ? fields.additionalDisks.behavior.value.defaultValue
      : fields?.additionalDisks?.behavior.case === 'locked'
        ? fields.additionalDisks.behavior.value
        : undefined;
  return {
    ...values,
    catalogItemId: catalogItem.id,
    spec: {
      ...values.spec,
      userData:
        fields?.userData?.behavior.case === 'editable'
          ? (fields.userData.behavior.value.defaultValue ?? '')
          : fields?.userData?.behavior.case === 'locked'
            ? fields.userData.behavior.value
            : '',
      sshKey: {
        name:
          catalogItem.fields?.sshKey?.behavior?.case === 'locked'
            ? catalogItem.fields.sshKey.behavior.value.name
            : catalogItem.fields?.sshKey?.behavior?.case === 'editable'
              ? (catalogItem.fields.sshKey.behavior.value.defaultValue?.name ?? '')
              : '',
      },
      bootDisk: { sizeGib: stringValue(value), storageTier: tier },
      additionalDisks:
        additional?.items.map((entry) => ({
          sizeGib: String(entry.sizeGib ?? ''),
          storageTier: entry.storageTier
            ? { id: entry.storageTier.id, name: entry.storageTier.name }
            : values.spec.bootDisk.storageTier,
        })) ?? [],
    },
  };
};

const tierField = (
  storageTier: ResourceSelectValue,
): { storageTier?: { id?: string; name?: string } } => {
  const id = storageTier?.id?.trim() ?? '';
  const name = storageTier?.name?.trim() ?? '';
  if (!id && !name) {
    return {};
  }
  return {
    storageTier: {
      ...(id ? { id } : {}),
      ...(name ? { name } : {}),
    },
  };
};

export const buildComputeInstanceCreatePayload = (
  values: ComputeInstanceWizardValues,
  catalogItem: ComputeInstanceCatalogItem,
): MessageInitShape<typeof ComputeInstanceSchema> => {
  const spec: MessageInitShape<typeof ComputeInstanceSchema>['spec'] = {
    catalogItem: {
      id: catalogItem.id,
    },
    instanceType: {
      id: values.spec.instanceType,
    },
    runStrategy: ComputeInstanceRunStrategy.COMPUTE_INSTANCE_RUN_STRATEGY_ALWAYS,
  };

  if (!values.spec.networking.useDefaultNetwork) {
    const subnetId = values.spec.networking.subnet.id.trim();
    if (subnetId) {
      spec.networkAttachments = [
        {
          subnet: { id: subnetId },
          securityGroups: values.spec.networking.securityGroups
            .filter((sg) => sg.id.trim())
            .map((sg) => ({ id: sg.id })),
        },
      ];
    }
  }

  if (values.spec.networking.autoExternalIpAttachment) {
    spec.autoExternalIpAttachment = true;
  }

  const sshKeyName = values.spec.sshKey.name.trim();
  if (sshKeyName) {
    spec.sshKey = { name: sshKeyName };
  }

  if (values.spec.userDataSource === 'secret') {
    const userDataSecretName = values.spec.userDataSecret.name.trim();
    if (userDataSecretName) {
      spec.userDataSecret = { name: userDataSecretName };
    }
  } else {
    const userData = values.spec.userData.trim();
    if (userData) {
      spec.userData = userData;
    }
  }

  const bootDiskRaw = values.spec.bootDisk.sizeGib.trim();
  if (bootDiskRaw) {
    spec.bootDisk = {
      sizeGib: Number(bootDiskRaw),
      ...tierField(values.spec.bootDisk.storageTier),
    };
  }

  const additionalDisks = values.spec.additionalDisks
    .filter((disk) => disk.sizeGib.trim())
    .map((disk) => ({ sizeGib: Number(disk.sizeGib.trim()), ...tierField(disk.storageTier) }));
  const hasAdditionalDisksDefault =
    catalogItem.fields?.additionalDisks?.behavior.case !== undefined;
  if (additionalDisks.length > 0 || hasAdditionalDisksDefault) {
    spec.additionalDisks = additionalDisks;
  }

  return {
    metadata: { name: values.metadata.name.trim(), project: values.metadata.project },
    spec,
  };
};
