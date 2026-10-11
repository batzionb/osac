import { BareMetalInstanceCatalogItem } from '@osac/types';

import type { ResourceSelectValue } from '../../Form/resourceSelectValue';
import { emptyResourceSelectValue } from '../../Form/resourceSelectValue';

export const BM_SSH_KEY_FORM_PATH = 'spec.sshKey';

export const BM_USER_DATA_FORM_PATH = 'spec.userData';

export const BM_INSTANCE_TYPE_FORM_PATH = 'spec.instanceType.name';

export interface BareMetalNetworkAttachmentRow {
  id: string;
  virtualNetwork: ResourceSelectValue;
  subnet: ResourceSelectValue;
  securityGroups: ResourceSelectValue[];
}

export interface BareMetalNetworkingFormValues {
  useDefaults: boolean;
  attachments: BareMetalNetworkAttachmentRow[];
  attachExternalIp: boolean;
}

export interface BareMetalInstanceWizardValues {
  catalogItemId: string;
  metadata: {
    name: string;
    project: string;
  };
  spec: {
    sshKey: string;
    userData: string;
    instanceType: {
      name: string;
    };
    diskImage: ResourceSelectValue;
    networking: BareMetalNetworkingFormValues;
  };
}

export const hasBareMetalAuthentication = (
  sshKey: string | undefined,
  userData: string | undefined,
): boolean => Boolean(sshKey?.trim() || userData?.trim());

let nextAttachmentId = 1;

export const createNetworkAttachmentRowId = (): string => {
  return `attachment-${nextAttachmentId++}`;
};

export const createEmptyNetworkAttachmentRow = (): BareMetalNetworkAttachmentRow => ({
  id: createNetworkAttachmentRowId(),
  virtualNetwork: emptyResourceSelectValue(),
  subnet: emptyResourceSelectValue(),
  securityGroups: [],
});

export const createEmptyBareMetalNetworkingValues = (): BareMetalNetworkingFormValues => ({
  useDefaults: true,
  attachments: [createEmptyNetworkAttachmentRow()],
  attachExternalIp: false,
});

export const createEmptyBareMetalInstanceValues = (): BareMetalInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '', project: '' },
  spec: {
    sshKey: '',
    userData: '',
    instanceType: {
      name: '',
    },
    diskImage: emptyResourceSelectValue(),
    networking: createEmptyBareMetalNetworkingValues(),
  },
});

export const getBareMetalInstanceInitialValues = (
  catalogItem?: BareMetalInstanceCatalogItem,
): BareMetalInstanceWizardValues => {
  const values = createEmptyBareMetalInstanceValues();
  if (!catalogItem) {
    return values;
  }
  return {
    ...values,
    catalogItemId: catalogItem.id,
    spec: {
      ...values.spec,
      sshKey:
        catalogItem.fields?.sshPublicKey?.behavior.case === 'editable'
          ? (catalogItem.fields.sshPublicKey.behavior.value.defaultValue ?? '')
          : catalogItem.fields?.sshPublicKey?.behavior.case === 'locked'
            ? catalogItem.fields.sshPublicKey.behavior.value
            : '',
      userData:
        catalogItem.fields?.userData?.behavior.case === 'editable'
          ? (catalogItem.fields.userData.behavior.value.defaultValue ?? '')
          : catalogItem.fields?.userData?.behavior.case === 'locked'
            ? catalogItem.fields.userData.behavior.value
            : '',
      instanceType: {
        name:
          catalogItem.fields?.instanceType?.behavior.case === 'editable'
            ? (catalogItem.fields.instanceType.behavior.value.defaultValue?.name ?? '')
            : catalogItem.fields?.instanceType?.behavior.case === 'locked'
              ? catalogItem.fields.instanceType.behavior.value.name
              : '',
      },
    },
  };
};
