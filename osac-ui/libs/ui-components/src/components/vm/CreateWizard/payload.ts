import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ComputeInstanceCatalogItem, ComputeInstanceSchema } from '@osac/types';
import { ComputeInstanceRunStrategy } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import { computeInstanceTypeReferenceFromPolicy } from '../../catalog/computeCatalogItemResourceDisplay';
import { type ResourceSelectValue, emptyResourceSelectValue } from '../../Form/resourceSelectValue';
import {
  boolFieldFromPolicy,
  networkAttachmentFieldsFromPolicy,
} from '../../ProvisioningWizard/fields/networkAttachmentPolicy';
import {
  provisioningFieldFromPolicy,
  provisioningFieldValue,
} from '../../ProvisioningWizard/fields/provisioningFieldValue';

export const createEmptyComputeInstanceValues = (): ComputeInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '', project: '' },
  spec: {
    sshKey: provisioningFieldValue(''),
    instanceType: provisioningFieldValue(''),
    userDataSource: provisioningFieldValue('inline'),
    userData: provisioningFieldValue(''),
    userDataSecret: provisioningFieldValue(''),
    bootDisk: {
      sizeGib: provisioningFieldValue(''),
      storageTier: provisioningFieldValue(emptyResourceSelectValue()),
    },
    additionalDisks: provisioningFieldValue([]),
    networking: {
      useDefaultNetwork: provisioningFieldValue(true),
      virtualNetwork: provisioningFieldValue(emptyResourceSelectValue()),
      subnet: provisioningFieldValue(emptyResourceSelectValue()),
      securityGroups: provisioningFieldValue([]),
      autoExternalIpAttachment: provisioningFieldValue(false),
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
  const sizeGib =
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
        : emptyResourceSelectValue();
  const additional =
    fields?.additionalDisks?.behavior.case === 'editable'
      ? fields.additionalDisks.behavior.value.defaultValue
      : fields?.additionalDisks?.behavior.case === 'locked'
        ? fields.additionalDisks.behavior.value
        : undefined;
  const sshKeyName =
    catalogItem.fields?.sshKey?.behavior?.case === 'locked'
      ? catalogItem.fields.sshKey.behavior.value.name
      : catalogItem.fields?.sshKey?.behavior?.case === 'editable'
        ? (catalogItem.fields.sshKey.behavior.value.defaultValue?.name ?? '')
        : '';
  const userData =
    fields?.userData?.behavior.case === 'editable'
      ? (fields.userData.behavior.value.defaultValue ?? '')
      : fields?.userData?.behavior.case === 'locked'
        ? fields.userData.behavior.value
        : '';
  const instanceTypeRef = computeInstanceTypeReferenceFromPolicy(fields?.instanceType);
  const instanceTypeValue = instanceTypeRef?.id?.trim() || instanceTypeRef?.name?.trim() || '';
  return {
    ...values,
    catalogItemId: catalogItem.id,
    spec: {
      ...values.spec,
      userData: provisioningFieldFromPolicy(userData, fields?.userData),
      sshKey: provisioningFieldFromPolicy(sshKeyName, catalogItem.fields?.sshKey),
      instanceType: provisioningFieldFromPolicy(instanceTypeValue, fields?.instanceType),
      bootDisk: {
        sizeGib: provisioningFieldFromPolicy(stringValue(sizeGib), fields?.bootDisk?.sizeGib),
        storageTier: provisioningFieldFromPolicy(tier, fields?.bootDisk?.storageTier),
      },
      additionalDisks: provisioningFieldFromPolicy(
        additional?.items.map((entry) => ({
          sizeGib: String(entry.sizeGib ?? ''),
          storageTier: entry.storageTier
            ? { id: entry.storageTier.id, name: entry.storageTier.name }
            : emptyResourceSelectValue(),
        })) ?? [],
        fields?.additionalDisks,
      ),
      networking: {
        ...networkAttachmentFieldsFromPolicy(
          fields?.networkAttachments,
          fields?.networkAttachments?.behavior.case === 'locked'
            ? fields.networkAttachments.behavior.value.items[0]
            : fields?.networkAttachments?.behavior.case === 'editable'
              ? fields.networkAttachments.behavior.value.defaultValue?.items[0]
              : undefined,
        ),
        autoExternalIpAttachment: boolFieldFromPolicy(fields?.autoExternalIpAttachment),
      },
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
      id: values.spec.instanceType.value,
    },
    runStrategy: ComputeInstanceRunStrategy.COMPUTE_INSTANCE_RUN_STRATEGY_ALWAYS,
  };

  if (!values.spec.networking.useDefaultNetwork.value) {
    const subnetId = values.spec.networking.subnet.value.id.trim();
    if (subnetId) {
      spec.networkAttachments = [
        {
          subnet: { id: subnetId },
          securityGroups: values.spec.networking.securityGroups.value
            .filter((sg) => sg.id.trim())
            .map((sg) => ({ id: sg.id })),
        },
      ];
    }
  }

  if (values.spec.networking.autoExternalIpAttachment.value) {
    spec.autoExternalIpAttachment = true;
  }

  const sshKeyName = values.spec.sshKey.value.trim();
  if (sshKeyName) {
    spec.sshKey = { name: sshKeyName };
  }

  if (values.spec.userDataSource.value === 'secret') {
    const userDataSecretName = values.spec.userDataSecret.value.trim();
    if (userDataSecretName) {
      spec.userDataSecret = { name: userDataSecretName };
    }
  } else {
    const userData = values.spec.userData.value.trim();
    if (userData) {
      spec.userData = userData;
    }
  }

  const bootDiskRaw = values.spec.bootDisk.sizeGib.value.trim();
  if (bootDiskRaw) {
    spec.bootDisk = {
      sizeGib: Number(bootDiskRaw),
      ...tierField(values.spec.bootDisk.storageTier.value),
    };
  }

  const additionalDisks = values.spec.additionalDisks.value
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
