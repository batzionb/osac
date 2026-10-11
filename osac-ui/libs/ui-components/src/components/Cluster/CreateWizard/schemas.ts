import type { TFunction } from 'i18next';
import * as yup from 'yup';

import { buildNetworkAttachmentSchemas } from '@osac/ui-components/validation/network-attachment';
import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

import type { ClusterNodeSetRow } from './fields';
import {} from './fields';
import { buildCidrSchema, cidrsOverlap, isValidCidr } from '../../../validation/cidr-validation';
import { isValidSshPublicKey } from '../../ProvisioningWizard/credentialValidation';

export type ClusterWizardStepId = 'catalog' | 'general' | 'configuration' | 'networking' | 'review';

const nodeSetRowSchema = (t: TFunction) =>
  yup.object({
    rowId: yup.string().required(),
    name: resourceNameSchema(t),
    hostType: yup.string().required(t('Host type is required')),
    size: yup
      .string()
      .required(t('Pool size is required'))
      .test('pool-size-positive', t('Pool size must be greater than zero'), (value) => {
        const parsed = Number(value?.trim());
        return Number.isFinite(parsed) && parsed > 0;
      }),
  });

const buildClusterFieldDefinitions = (t: TFunction) => {
  const rowSchema = nodeSetRowSchema(t);

  return {
    catalogItemId: yup.string().required(t('Select a catalog item')),
    metadataName: resourceNameSchema(t),
    specSshPublicKey: yup
      .string()
      .test(
        'ssh-public-key',
        t(
          'SSH public key must be in the form "[TYPE] key [[EMAIL]]". Supported types are ssh-rsa, ssh-ed25519, and ecdsa-sha2-nistp256/384/521.',
        ),
        (value) => isValidSshPublicKey(value),
      ),
    specVersionName: yup.string().trim().required(t('Version is required')),
    specNodeSetRows: yup
      .array()
      .of(rowSchema)
      .min(1, t('At least one node set is required'))
      .test('unique-node-set-names', function (rows) {
        const seenNames = new Set<string>();
        for (const [rowIndex, row] of (rows ?? []).entries()) {
          const name = row?.name?.trim() ?? '';
          if (!name) {
            continue;
          }
          if (seenNames.has(name)) {
            return this.createError({
              path: `${this.path}[${rowIndex}].name`,
              message: t('Node set names must be unique'),
            });
          }
          seenNames.add(name);
        }
        return true;
      }),
    specNetwork: yup.object({
      podCidr: buildCidrSchema(t, 'ipv4'),
      serviceCidr: buildCidrSchema(t, 'ipv4').test(
        'service-cidr-no-overlap',
        t('Service CIDR must not overlap the pod CIDR.'),
        function (value) {
          const parent = this.parent as { podCidr?: string } | undefined;
          const podCidr = parent?.podCidr ?? '';
          if (!value?.trim() || !podCidr.trim()) {
            return true;
          }
          if (!isValidCidr(value, 'ipv4') || !isValidCidr(podCidr, 'ipv4')) {
            return true;
          }
          return !cidrsOverlap(podCidr, value, 'ipv4');
        },
      ),
    }),
    specUseDefaultNetwork: yup.boolean(),
    specAutoExternalIpAttachment: yup.boolean(),
  };
};

export const buildClusterStepSchema = (
  stepId: ClusterWizardStepId,
  t: TFunction,
): yup.AnyObjectSchema | undefined => {
  if (stepId === 'review') {
    return undefined;
  }

  const fields = buildClusterFieldDefinitions(t);

  switch (stepId) {
    case 'catalog':
      return yup.object({
        catalogItemId: fields.catalogItemId,
      });
    case 'general':
      return yup.object({
        metadata: yup.object({
          name: fields.metadataName,
        }),
        spec: yup.object({
          sshPublicKey: fields.specSshPublicKey,
          pullSecretSecret: yup.object({
            name: yup.string().required(t('Pull secret is required')),
          }),
        }),
      });
    case 'configuration':
      return yup.object({
        spec: yup.object({
          versionName: fields.specVersionName,
          nodeSetRows: fields.specNodeSetRows,
        }),
      });
    case 'networking': {
      const na = buildNetworkAttachmentSchemas(t);
      return yup.object({
        spec: yup.object({
          network: fields.specNetwork,
          useDefaultNetwork: fields.specUseDefaultNetwork,
          networkAttachment: yup.object().when('useDefaultNetwork', {
            is: false,
            then: () =>
              yup.object({
                virtualNetwork: na.requiredVirtualNetwork,
                subnet: na.requiredSubnet,
                securityGroups: na.securityGroupsSchema,
              }),
            otherwise: () =>
              yup.object({
                virtualNetwork: na.optionalResourceSelect,
                subnet: na.optionalResourceSelect,
                securityGroups: na.securityGroupsSchema,
              }),
          }),
          autoExternalIpAttachment: fields.specAutoExternalIpAttachment,
        }),
      });
    }
    default:
      return undefined;
  }
};

export type { ClusterNodeSetRow };
