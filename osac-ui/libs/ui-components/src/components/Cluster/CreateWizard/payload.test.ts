import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import { createEmptyNodeSetRow } from './fields';
import {
  buildClusterCreatePayload,
  createEmptyClusterValues,
  getClusterInitialValues,
} from './payload';
import { provisioningFieldValue } from '../../ProvisioningWizard/fields/provisioningFieldValue';

const clusterCatalogItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-openshift-4',
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    displayName: '',
    description: '',
    name: 'catalog-openshift-4',
    annotations: {},
    creator: 'foo',
    labels: {},
    project: 'foo',
    tenant: 'foo',
    version: 1,
  },
  title: 'OpenShift 4 cluster',
  description: 'Standard OpenShift cluster offering',
  template: {
    $typeName: 'osac.public.v1.ClusterTemplateReference',
    id: 'tpl-openshift-4',
    name: '',
    project: '',
    shared: false,
  },
  published: true,
  templateParameters: {},
};

describe('buildClusterCreatePayload', () => {
  it('builds catalog-item create payload with node sets keyed by user-defined IDs', () => {
    const row = createEmptyNodeSetRow();
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        sshPublicKey: provisioningFieldValue('ssh-rsa AAAA'),
        pullSecretSecret: provisioningFieldValue('pull-secret'),
        versionName: provisioningFieldValue('4-17-0'),
        nodeSetRows: provisioningFieldValue([
          {
            ...row,
            name: 'production',
            hostType: 'acme_1tb',
            size: '3',
          },
        ]),
        network: {
          podCidr: provisioningFieldValue('10.128.0.0/14'),
          serviceCidr: provisioningFieldValue(''),
        },
      },
    };

    expect(buildClusterCreatePayload(values, clusterCatalogItem)).toEqual({
      metadata: { name: 'my-cluster', project: '' },
      spec: {
        catalogItem: { id: clusterCatalogItem.id },
        sshPublicKey: 'ssh-rsa AAAA',
        pullSecretSecret: { name: 'pull-secret' },
        version: { name: '4-17-0' },
        nodeSets: {
          production: { hostType: { id: 'acme_1tb' }, size: 3 },
        },
        network: {
          podCidr: '10.128.0.0/14',
        },
      },
    });
  });

  it('omits blank optional fields, version, and node sets when no valid rows exist', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'empty-pools', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        versionName: provisioningFieldValue(''),
        nodeSetRows: provisioningFieldValue([]),
        network: { podCidr: provisioningFieldValue(''), serviceCidr: provisioningFieldValue('') },
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec).toEqual({
      catalogItem: { id: clusterCatalogItem.id },
      pullSecretSecret: { name: 'secret' },
    });
    expect(payload.spec).not.toHaveProperty('version');
    expect(payload.spec).not.toHaveProperty('nodeSets');
    expect(payload.spec).not.toHaveProperty('network');
  });

  it('filters out invalid node set rows from the payload', () => {
    const row = createEmptyNodeSetRow();
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'filtered-pools', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        versionName: provisioningFieldValue('4-17-0'),
        nodeSetRows: provisioningFieldValue([
          { ...row, name: 'empty-host-type', hostType: '', size: '3' },
          { ...row, name: 'zero-size', hostType: 'acme_1tb', size: '0' },
          { ...row, name: 'invalid-size', hostType: 'acme_2tb', size: 'not-a-number' },
          { ...row, name: 'production', hostType: 'acme_1tb', size: '3' },
          { ...row, name: 'development', hostType: 'acme_1tb', size: '2' },
        ]),
        network: { podCidr: provisioningFieldValue(''), serviceCidr: provisioningFieldValue('') },
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec?.nodeSets).toEqual({
      production: { hostType: { id: 'acme_1tb' }, size: 3 },
      development: { hostType: { id: 'acme_1tb' }, size: 2 },
    });
  });

  it('preserves __proto__ as a node set name in the payload', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'proto-pool', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        versionName: provisioningFieldValue('4-17-0'),
        nodeSetRows: provisioningFieldValue([
          {
            ...createEmptyNodeSetRow(),
            name: '__proto__',
            hostType: 'acme_1tb',
            size: '3',
          },
        ]),
        network: { podCidr: provisioningFieldValue(''), serviceCidr: provisioningFieldValue('') },
      },
    };

    const nodeSets = buildClusterCreatePayload(values, clusterCatalogItem).spec?.nodeSets;
    expect(Object.keys(nodeSets ?? {})).toContain('__proto__');
    expect(nodeSets?.['__proto__']).toEqual({ hostType: { id: 'acme_1tb' }, size: 3 });
  });

  it('omits networkAttachment when useDefaultNetwork is true', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        useDefaultNetwork: provisioningFieldValue(true),
        networkAttachment: {
          virtualNetwork: provisioningFieldValue({ id: 'vn-1', name: 'vn-1' }),
          subnet: provisioningFieldValue({ id: 'subnet-1', name: 'subnet-1' }),
          securityGroups: provisioningFieldValue([{ id: 'sg-1', name: 'sg-1' }]),
        },
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec).not.toHaveProperty('networkAttachment');
  });

  it('omits networkAttachment when useDefaultNetwork is false but pickers are empty', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        useDefaultNetwork: provisioningFieldValue(false),
        networkAttachment: {
          virtualNetwork: provisioningFieldValue({ id: '', name: '' }),
          subnet: provisioningFieldValue({ id: '', name: '' }),
          securityGroups: provisioningFieldValue([]),
        },
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec).not.toHaveProperty('networkAttachment');
  });

  it('includes networkAttachment with subnet and security groups when pickers have values', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        useDefaultNetwork: provisioningFieldValue(false),
        networkAttachment: {
          virtualNetwork: provisioningFieldValue({ id: 'vn-1', name: 'tenant-vn' }),
          subnet: provisioningFieldValue({ id: 'my-subnet', name: 'tenant-subnet' }),
          securityGroups: provisioningFieldValue([
            { id: 'sg-1', name: 'default-sg-1' },
            { id: 'sg-2', name: 'default-sg-2' },
          ]),
        },
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec?.networkAttachment).toEqual({
      subnet: { id: 'my-subnet' },
      securityGroups: [{ id: 'sg-1' }, { id: 'sg-2' }],
    });
  });

  it('includes autoExternalIpAttachment only when true', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        autoExternalIpAttachment: provisioningFieldValue(true),
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec?.autoExternalIpAttachment).toBe(true);
  });

  it('omits autoExternalIpAttachment when false', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        autoExternalIpAttachment: provisioningFieldValue(false),
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec).not.toHaveProperty('autoExternalIpAttachment');
  });

  it.each([
    ['default (no project)', ''],
    ['top-level project', 'my-project'],
    ['nested project path', 'parent.child'],
  ])('passes the selected %s through to metadata.project', (_label, project) => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster', project },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
      },
    };

    expect(buildClusterCreatePayload(values, clusterCatalogItem).metadata).toEqual({
      name: 'my-cluster',
      project,
    });
  });
});

describe('buildClusterCreatePayload — locked catalog fields', () => {
  it('omits a locked version so the catalog policy can apply it', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'locked-version', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        versionName: provisioningFieldValue('4-22-0', true),
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec).not.toHaveProperty('version');
    expect(payload.spec?.pullSecretSecret).toEqual({ name: 'secret' });
  });

  it('sends version when the catalog policy is not locked', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'editable-version', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        versionName: provisioningFieldValue('4-20-0'),
      },
    };

    expect(buildClusterCreatePayload(values, clusterCatalogItem).spec?.version).toEqual({
      name: '4-20-0',
    });
  });

  it('omits locked node sets, CIDRs, SSH key, and auto external IP', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'locked-fields', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('secret'),
        sshPublicKey: provisioningFieldValue('ssh-ed25519 AAAA', true),
        nodeSetRows: provisioningFieldValue(
          [
            {
              ...createEmptyNodeSetRow(),
              name: 'workers',
              hostType: 'bmit-worker',
              size: '2',
            },
          ],
          true,
        ),
        network: {
          podCidr: provisioningFieldValue('10.128.0.0/14', true),
          serviceCidr: provisioningFieldValue('172.30.0.0/16', true),
        },
        autoExternalIpAttachment: provisioningFieldValue(true, true),
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec).not.toHaveProperty('sshPublicKey');
    expect(payload.spec).not.toHaveProperty('nodeSets');
    expect(payload.spec).not.toHaveProperty('network');
    expect(payload.spec).not.toHaveProperty('autoExternalIpAttachment');
  });

  it('omits a locked pull secret and custom network attachment', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'locked-attachment', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecretSecret: provisioningFieldValue('catalog-secret', true),
        useDefaultNetwork: provisioningFieldValue(false, true),
        networkAttachment: {
          virtualNetwork: provisioningFieldValue({ id: 'vn-1', name: 'vn-1' }, true),
          subnet: provisioningFieldValue({ id: 'subnet-1', name: 'subnet-1' }, true),
          securityGroups: provisioningFieldValue([{ id: 'sg-1', name: 'sg-1' }], true),
        },
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec).not.toHaveProperty('pullSecretSecret');
    expect(payload.spec).not.toHaveProperty('networkAttachment');
  });
});

describe('getClusterInitialValues — node sets', () => {
  it('prepopulates and locks node set rows from a locked catalog policy', () => {
    const values = getClusterInitialValues({
      ...clusterCatalogItem,
      fields: {
        nodeSets: {
          behavior: {
            case: 'locked',
            value: {
              items: {
                workers: {
                  size: 2,
                  hostType: { id: 'bmit-worker', name: 'worker', shared: true },
                },
              },
            },
          },
        },
      },
    } as ClusterCatalogItem);

    expect(values.spec.nodeSetRows.locked).toBe(true);
    expect(values.spec.nodeSetRows.value).toHaveLength(1);
    expect(values.spec.nodeSetRows.value[0]).toMatchObject({
      name: 'workers',
      hostType: 'bmit-worker',
      size: '2',
    });
  });

  it('prepopulates editable node set defaults without locking', () => {
    const values = getClusterInitialValues({
      ...clusterCatalogItem,
      fields: {
        nodeSets: {
          behavior: {
            case: 'editable',
            value: {
              defaultValue: {
                items: {
                  workers: {
                    size: 3,
                    hostType: { id: 'bmit-gpu', name: 'gpu-host' },
                  },
                  infra: {
                    size: 1,
                    hostType: { name: 'worker' },
                  },
                },
              },
            },
          },
        },
      },
    } as ClusterCatalogItem);

    expect(values.spec.nodeSetRows.locked).toBe(false);
    expect(values.spec.nodeSetRows.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'workers',
          hostType: 'bmit-gpu',
          size: '3',
        }),
        expect.objectContaining({
          name: 'infra',
          hostType: 'worker',
          size: '1',
        }),
      ]),
    );
  });

  it('keeps an empty unlocked row when the catalog does not govern node sets', () => {
    const values = getClusterInitialValues(clusterCatalogItem);

    expect(values.spec.nodeSetRows.locked).toBe(false);
    expect(values.spec.nodeSetRows.value).toHaveLength(1);
    expect(values.spec.nodeSetRows.value[0]).toMatchObject({
      name: '',
      hostType: '',
      size: '',
    });
  });
});
