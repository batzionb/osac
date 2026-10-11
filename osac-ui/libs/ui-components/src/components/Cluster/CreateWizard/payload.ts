import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ClusterCatalogItem, ClusterSchema } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import { createEmptyNodeSetRow } from './fields';
import { emptyResourceSelectValue } from '../../Form/resourceSelectValue';

export const createEmptyClusterValues = (): ClusterWizardValues => ({
  catalogItemId: '',
  metadata: { name: '', project: '' },
  spec: {
    sshPublicKey: '',
    pullSecretSecret: {
      name: '',
    },
    versionName: '',
    nodeSetRows: [createEmptyNodeSetRow()],
    network: {
      podCidr: '',
      serviceCidr: '',
    },
    useDefaultNetwork: true,
    networkAttachment: {
      virtualNetwork: emptyResourceSelectValue(),
      subnet: emptyResourceSelectValue(),
      securityGroups: [],
    },
    autoExternalIpAttachment: false,
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
      sshPublicKey,
      pullSecretSecret: { name: pullSecret },
      versionName: version,
      network: {
        ...values.spec.network,
        podCidr,
        serviceCidr,
      },
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
      name: values.spec.pullSecretSecret.name,
    },
  };

  const sshPublicKey = values.spec.sshPublicKey.trim();
  if (sshPublicKey) {
    spec.sshPublicKey = sshPublicKey;
  }

  if (values.spec.versionName) {
    spec.version = { name: values.spec.versionName };
  }

  const nodeSets = Object.create(null) as Record<
    string,
    { hostType: { id: string }; size: number }
  >;
  for (const row of values.spec.nodeSetRows) {
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

  const podCidr = values.spec.network.podCidr.trim();
  const serviceCidr = values.spec.network.serviceCidr.trim();
  if (podCidr || serviceCidr) {
    spec.network = {
      ...(podCidr ? { podCidr } : {}),
      ...(serviceCidr ? { serviceCidr } : {}),
    };
  }

  if (!values.spec.useDefaultNetwork) {
    const subnetId = values.spec.networkAttachment.subnet.id.trim();
    if (subnetId) {
      spec.networkAttachment = {
        subnet: { id: subnetId },
        securityGroups: values.spec.networkAttachment.securityGroups
          .filter((sg) => sg.id.trim())
          .map((sg) => ({ id: sg.id })),
      };
    }
  }

  if (values.spec.autoExternalIpAttachment) {
    spec.autoExternalIpAttachment = true;
  }

  return {
    metadata: { name: values.metadata.name.trim(), project: values.metadata.project },
    spec,
  };
};
