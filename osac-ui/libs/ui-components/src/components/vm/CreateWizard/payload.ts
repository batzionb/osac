import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ComputeInstanceCatalogItem, ComputeInstanceSchema } from '@osac/types';
import { ComputeInstanceRunStrategy } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import { type ResourceSelectValue, emptyResourceSelectValue } from '../../Form/resourceSelectValue';
import {
  getCatalogFieldOverlay,
  readCatalogFieldDefinitions,
} from '../../ProvisioningWizard/catalogOverlay';

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
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const value = (path: string): unknown =>
    getCatalogFieldOverlay(path, definitions, '').defaultValue;
  const stringValue = (path: string): string => {
    const raw = value(path);
    return typeof raw === 'string' || typeof raw === 'number' ? String(raw) : '';
  };
  const storageTier = value('spec.boot_disk.storage_tier');
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
  const additional = value('spec.additional_disks');
  return {
    ...values,
    catalogItemId: catalogItem.id,
    spec: {
      ...values.spec,
      userData: stringValue('spec.user_data'),
      sshKey: {
        name:
          catalogItem.fields?.sshKey?.behavior?.case === 'locked'
            ? catalogItem.fields.sshKey.behavior.value.name
            : catalogItem.fields?.sshKey?.behavior?.case === 'editable'
              ? (catalogItem.fields.sshKey.behavior.value.defaultValue?.name ?? '')
              : '',
      },
      bootDisk: { sizeGib: stringValue('spec.boot_disk.size_gib'), storageTier: tier },
      additionalDisks: Array.isArray(additional)
        ? additional.map((entry) => ({
            sizeGib:
              entry &&
              typeof entry === 'object' &&
              (typeof (entry as Record<string, unknown>).size_gib === 'string' ||
                typeof (entry as Record<string, unknown>).size_gib === 'number')
                ? String((entry as Record<string, unknown>).size_gib)
                : '',
            storageTier: values.spec.bootDisk.storageTier,
          }))
        : [],
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
    getCatalogFieldOverlay('spec.additional_disks', readCatalogFieldDefinitions(catalogItem), '')
      .defaultValue !== undefined;
  if (additionalDisks.length > 0 || hasAdditionalDisksDefault) {
    spec.additionalDisks = additionalDisks;
  }

  return {
    metadata: { name: values.metadata.name.trim(), project: values.metadata.project },
    spec,
  };
};
