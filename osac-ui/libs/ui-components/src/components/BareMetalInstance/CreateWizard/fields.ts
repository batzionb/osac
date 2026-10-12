import { BareMetalInstanceCatalogItem } from '@osac/types';

import type { ResourceSelectValue } from '../../Form/resourceSelectValue';
import { emptyResourceSelectValue } from '../../Form/resourceSelectValue';
import type { ProvisioningFieldValue } from '../../ProvisioningWizard/fields/provisioningFieldValue';
import {
  boolFieldFromPolicy,
  networkAttachmentFieldsFromPolicy,
} from '../../ProvisioningWizard/fields/networkAttachmentPolicy';
import {
  provisioningFieldFromPolicy,
  provisioningFieldValue,
} from '../../ProvisioningWizard/fields/provisioningFieldValue';

export const BM_SSH_KEY_FORM_PATH = 'spec.sshKey';

export const BM_USER_DATA_FORM_PATH = 'spec.userData';
export const BM_USER_DATA_SOURCE_FORM_PATH = 'spec.userDataSource';
export const BM_USER_DATA_SECRET_FORM_PATH = 'spec.userDataSecret';

export const BM_INSTANCE_TYPE_FORM_PATH = 'spec.instanceType';

export const BM_DISK_IMAGE_FORM_PATH = 'spec.diskImage';

export interface BareMetalNetworkAttachmentRow {
  id: string;
  virtualNetwork: ProvisioningFieldValue<ResourceSelectValue>;
  subnet: ProvisioningFieldValue<ResourceSelectValue>;
  securityGroups: ProvisioningFieldValue<ResourceSelectValue[]>;
}

export interface BareMetalNetworkingFormValues {
  useDefaults: ProvisioningFieldValue<boolean>;
  attachments: BareMetalNetworkAttachmentRow[];
  attachExternalIp: ProvisioningFieldValue<boolean>;
}

export interface BareMetalInstanceWizardValues {
  catalogItemId: string;
  metadata: {
    name: string;
    project: string;
  };
  spec: {
    sshKey: ProvisioningFieldValue<string>;
    userDataSource: ProvisioningFieldValue<'inline' | 'secret'>;
    userData: ProvisioningFieldValue<string>;
    userDataSecret: ProvisioningFieldValue<string>;
    instanceType: ProvisioningFieldValue<string>;
    diskImage: ProvisioningFieldValue<ResourceSelectValue>;
    networking: BareMetalNetworkingFormValues;
  };
}

export const hasBareMetalAuthentication = (
  sshKey: string | undefined,
  userData: string | undefined,
  userDataSecretName?: string,
): boolean => Boolean(sshKey?.trim() || userData?.trim() || userDataSecretName?.trim());

let nextAttachmentId = 1;

export const createNetworkAttachmentRowId = (): string => {
  return `attachment-${nextAttachmentId++}`;
};

export const createEmptyNetworkAttachmentRow = (): BareMetalNetworkAttachmentRow => ({
  id: createNetworkAttachmentRowId(),
  virtualNetwork: provisioningFieldValue(emptyResourceSelectValue()),
  subnet: provisioningFieldValue(emptyResourceSelectValue()),
  securityGroups: provisioningFieldValue([]),
});

export const createEmptyBareMetalNetworkingValues = (): BareMetalNetworkingFormValues => ({
  useDefaults: provisioningFieldValue(true),
  attachments: [createEmptyNetworkAttachmentRow()],
  attachExternalIp: provisioningFieldValue(false),
});

export const createEmptyBareMetalInstanceValues = (): BareMetalInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '', project: '' },
  spec: {
    sshKey: provisioningFieldValue(''),
    userDataSource: provisioningFieldValue('inline'),
    userData: provisioningFieldValue(''),
    userDataSecret: provisioningFieldValue(''),
    instanceType: provisioningFieldValue(''),
    diskImage: provisioningFieldValue(emptyResourceSelectValue()),
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
      sshKey: provisioningFieldFromPolicy(
        catalogItem.fields?.sshPublicKey?.behavior.case === 'editable'
          ? (catalogItem.fields.sshPublicKey.behavior.value.defaultValue ?? '')
          : catalogItem.fields?.sshPublicKey?.behavior.case === 'locked'
            ? catalogItem.fields.sshPublicKey.behavior.value
            : '',
        catalogItem.fields?.sshPublicKey,
      ),
      userData: provisioningFieldFromPolicy(
        catalogItem.fields?.userData?.behavior.case === 'editable'
          ? (catalogItem.fields.userData.behavior.value.defaultValue ?? '')
          : catalogItem.fields?.userData?.behavior.case === 'locked'
            ? catalogItem.fields.userData.behavior.value
            : '',
        catalogItem.fields?.userData,
      ),
      instanceType: provisioningFieldFromPolicy(
        catalogItem.fields?.instanceType?.behavior.case === 'editable'
          ? (catalogItem.fields.instanceType.behavior.value.defaultValue?.name ?? '')
          : catalogItem.fields?.instanceType?.behavior.case === 'locked'
            ? catalogItem.fields.instanceType.behavior.value.name
            : '',
        catalogItem.fields?.instanceType,
      ),
      diskImage: provisioningFieldFromPolicy(
        emptyResourceSelectValue(),
        catalogItem.fields?.diskImage,
      ),
      networking: (() => {
        const attachmentList =
          catalogItem.fields?.networkAttachments?.behavior.case === 'locked'
            ? catalogItem.fields.networkAttachments.behavior.value
            : catalogItem.fields?.networkAttachments?.behavior.case === 'editable'
              ? catalogItem.fields.networkAttachments.behavior.value.defaultValue
              : undefined;
        const attachment = attachmentList?.items[0];
        const fields = networkAttachmentFieldsFromPolicy(
          catalogItem.fields?.networkAttachments,
          attachment,
        );
        return {
          useDefaults: fields.useDefaultNetwork,
          attachments: [
            {
              ...createEmptyNetworkAttachmentRow(),
              virtualNetwork: fields.virtualNetwork,
              subnet: fields.subnet,
              securityGroups: fields.securityGroups,
            },
          ],
          attachExternalIp: boolFieldFromPolicy(catalogItem.fields?.autoExternalIpAttachment),
        };
      })(),
    },
  };
};
