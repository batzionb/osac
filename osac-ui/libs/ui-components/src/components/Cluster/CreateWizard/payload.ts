import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ClusterCatalogItem, ClusterSchema } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import { createEmptyNodeSetRow } from './fields';
import { emptyResourceSelectValue } from '../../Form/resourceSelectValue';
import {
  boolFieldFromPolicy,
  networkAttachmentFieldsFromPolicy,
} from '../../ProvisioningWizard/fields/networkAttachmentPolicy';
import {
  provisioningFieldFromPolicy,
  provisioningFieldValue,
} from '../../ProvisioningWizard/fields/provisioningFieldValue';

export const createEmptyClusterValues = (): ClusterWizardValues => ({
  catalogItemId: '',
  metadata: { name: '', project: '' },
  spec: {
    sshPublicKey: provisioningFieldValue(''),
    pullSecretSecret: provisioningFieldValue(''),
    versionName: provisioningFieldValue(''),
    nodeSetRows: provisioningFieldValue([createEmptyNodeSetRow()]),
    network: {
      podCidr: provisioningFieldValue(''),
      serviceCidr: provisioningFieldValue(''),
    },
    useDefaultNetwork: provisioningFieldValue(true),
    networkAttachment: {
      virtualNetwork: provisioningFieldValue(emptyResourceSelectValue()),
      subnet: provisioningFieldValue(emptyResourceSelectValue()),
      securityGroups: provisioningFieldValue([]),
    },
    autoExternalIpAttachment: provisioningFieldValue(false),
  },
});

export const getClusterInitialValues = (catalogItem?: ClusterCatalogItem): ClusterWizardValues => {
  const values = createEmptyClusterValues();
  if (!catalogItem) {
    return values;
  }
  const fields = catalogItem.fields;
  const sshPublicKey =
    fields?.sshPublicKey?.behavior.case === 'editable'
      ? (fields.sshPublicKey.behavior.value.defaultValue ?? '')
      : fields?.sshPublicKey?.behavior.case === 'locked'
        ? fields.sshPublicKey.behavior.value
        : '';
  const pullSecret =
    fields?.pullSecretSecret?.behavior.case === 'editable'
      ? (fields.pullSecretSecret.behavior.value.defaultValue?.name ?? '')
      : fields?.pullSecretSecret?.behavior.case === 'locked'
        ? fields.pullSecretSecret.behavior.value.name
        : '';
  const version =
    fields?.version?.behavior.case === 'editable'
      ? (fields.version.behavior.value.defaultValue?.name ?? '')
      : fields?.version?.behavior.case === 'locked'
        ? fields.version.behavior.value.name
        : '';
  const podCidr =
    fields?.network?.podCidr?.behavior.case === 'editable'
      ? (fields.network.podCidr.behavior.value.defaultValue ?? '')
      : fields?.network?.podCidr?.behavior.case === 'locked'
        ? fields.network.podCidr.behavior.value
        : '';
  const serviceCidr =
    fields?.network?.serviceCidr?.behavior.case === 'editable'
      ? (fields.network.serviceCidr.behavior.value.defaultValue ?? '')
      : fields?.network?.serviceCidr?.behavior.case === 'locked'
        ? fields.network.serviceCidr.behavior.value
        : '';
  return {
    ...values,
    catalogItemId: catalogItem.id,
    spec: {
      ...values.spec,
      sshPublicKey: provisioningFieldFromPolicy(sshPublicKey, fields?.sshPublicKey),
      pullSecretSecret: provisioningFieldFromPolicy(pullSecret, fields?.pullSecretSecret),
      versionName: provisioningFieldFromPolicy(version, fields?.version),
      nodeSetRows: provisioningFieldFromPolicy(values.spec.nodeSetRows.value, fields?.nodeSets),
      network: {
        podCidr: provisioningFieldFromPolicy(podCidr, fields?.network?.podCidr),
        serviceCidr: provisioningFieldFromPolicy(serviceCidr, fields?.network?.serviceCidr),
      },
      ...(() => {
        const attachment =
          fields?.networkAttachment?.behavior.case === 'locked'
            ? fields.networkAttachment.behavior.value
            : fields?.networkAttachment?.behavior.case === 'editable'
              ? fields.networkAttachment.behavior.value.defaultValue
              : undefined;
        const networkFields = networkAttachmentFieldsFromPolicy(
          fields?.networkAttachment,
          attachment,
        );
        return {
          useDefaultNetwork: networkFields.useDefaultNetwork,
          networkAttachment: {
            virtualNetwork: networkFields.virtualNetwork,
            subnet: networkFields.subnet,
            securityGroups: networkFields.securityGroups,
          },
          autoExternalIpAttachment: boolFieldFromPolicy(fields?.autoExternalIpAttachment),
        };
      })(),
    },
  };
};

export const buildClusterCreatePayload = (
  values: ClusterWizardValues,
  catalogItem: ClusterCatalogItem,
): MessageInitShape<typeof ClusterSchema> => {
  const spec: MessageInitShape<typeof ClusterSchema>['spec'] = {
    catalogItem: {
      id: catalogItem.id,
    },
    pullSecretSecret: {
      name: values.spec.pullSecretSecret.value,
    },
  };

  const sshPublicKey = values.spec.sshPublicKey.value.trim();
  if (sshPublicKey) {
    spec.sshPublicKey = sshPublicKey;
  }

  if (values.spec.versionName.value) {
    spec.version = { name: values.spec.versionName.value };
  }

  const nodeSets = Object.create(null) as Record<
    string,
    { hostType: { id: string }; size: number }
  >;
  for (const row of values.spec.nodeSetRows.value) {
    const nodeSetId = row.name.trim();
    const hostTypeId = row.hostType;
    const size = Number(row.size);
    if (!nodeSetId || !hostTypeId || !Number.isFinite(size) || size <= 0) {
      continue;
    }
    nodeSets[nodeSetId] = { hostType: { id: hostTypeId }, size };
  }
  if (Object.keys(nodeSets).length > 0) {
    spec.nodeSets = nodeSets;
  }

  const podCidr = values.spec.network.podCidr.value.trim();
  const serviceCidr = values.spec.network.serviceCidr.value.trim();
  if (podCidr || serviceCidr) {
    spec.network = {
      ...(podCidr ? { podCidr } : {}),
      ...(serviceCidr ? { serviceCidr } : {}),
    };
  }

  if (!values.spec.useDefaultNetwork.value) {
    const subnetId = values.spec.networkAttachment.subnet.value.id.trim();
    if (subnetId) {
      spec.networkAttachment = {
        subnet: { id: subnetId },
        securityGroups: values.spec.networkAttachment.securityGroups.value
          .filter((sg) => sg.id.trim())
          .map((sg) => ({ id: sg.id })),
      };
    }
  }

  if (values.spec.autoExternalIpAttachment.value) {
    spec.autoExternalIpAttachment = true;
  }

  return {
    metadata: { name: values.metadata.name.trim(), project: values.metadata.project },
    spec,
  };
};
