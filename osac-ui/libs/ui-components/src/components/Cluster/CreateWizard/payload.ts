import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ClusterCatalogItem, ClusterSchema } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import { createEmptyNodeSetRow } from './fields';
import { emptyResourceSelectValue } from '../../Form/resourceSelectValue';
import {
  getCatalogFieldOverlay,
  readCatalogFieldDefinitions,
} from '../../ProvisioningWizard/catalogOverlay';

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
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const defaultValue = (path: string): unknown =>
    getCatalogFieldOverlay(path, definitions, '').defaultValue;
  const asString = (path: string): string => {
    const value = defaultValue(path);
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  };
  const version = defaultValue('spec.version');
  return {
    ...values,
    catalogItemId: catalogItem.id,
    spec: {
      ...values.spec,
      sshPublicKey: asString('ssh_public_key'),
      pullSecretSecret: { name: asString('pull_secret_secret.name') },
      versionName:
        version && typeof version === 'object' && 'name' in version
          ? typeof (version as { name?: unknown }).name === 'string'
            ? (version as { name: string }).name
            : ''
          : asString('spec.version'),
      network: {
        ...values.spec.network,
        podCidr: asString('spec.network.pod_cidr'),
        serviceCidr: asString('spec.network.service_cidr'),
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
