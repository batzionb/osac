import type { TFunction } from 'i18next';
import * as yup from 'yup';

import { buildNetworkAttachmentSchemas } from '@osac/ui-components/validation/network-attachment';
import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';
import { userDataSchema } from '@osac/ui-components/validation/user-data';


export type VmWizardStepId =
  | 'catalog'
  | 'general'
  | 'configuration'
  | 'storage'
  | 'networking'
  | 'review';

const storageTierSchema = (t: TFunction) =>
  yup
    .object({
      id: yup.string(),
      name: yup.string(),
    })
    .test('storage-tier-id-or-name', t('Storage tier is required'), (value) => {
      const id = value?.id?.trim() ?? '';
      const name = value?.name?.trim() ?? '';
      return Boolean(id || name);
    });

const buildComputeInstanceFieldDefinitions = (t: TFunction) => {
  return {
    catalogItemId: yup.string().required(t('catalogProvision.validation.catalogItemRequired')),
    metadataName: resourceNameSchema(t),
    specInstanceType: yup.string().required(t('catalogProvision.validation.instanceTypeRequired')),
    specUserData: userDataSchema(t),
    specBootDisk: yup.object({
      sizeGib: yup
        .string()
        .test(
          'boot-disk-number',
          t('catalogProvision.validation.bootDiskNumber'),
          (value) => !value?.trim() || !Number.isNaN(Number(value)),
        )
        .required(t('catalogProvision.validation.required')),
      storageTier: storageTierSchema(t),
    }),
    specAdditionalDisks: yup.array(
      yup.object({
        sizeGib: yup
          .string()
          .test('additional-disk-number', t('Additional disk size must be a number'), (value) => {
            const size = Number(value?.trim());
            return Number.isInteger(size) && size >= 1 && size <= 16384;
          }),
        storageTier: storageTierSchema(t),
      }),
    ),
    specNetworking: (() => {
      const na = buildNetworkAttachmentSchemas(t);
      return yup.object({
        useDefaultNetwork: yup.boolean(),
        virtualNetwork: yup.object().when('useDefaultNetwork', {
          is: false,
          then: () => na.requiredVirtualNetwork,
          otherwise: () => na.optionalResourceSelect,
        }),
        subnet: yup.object().when('useDefaultNetwork', {
          is: false,
          then: () => na.requiredSubnet,
          otherwise: () => na.optionalResourceSelect,
        }),
        securityGroups: na.securityGroupsSchema,
        autoExternalIpAttachment: yup.boolean(),
      });
    })(),
  };
};

/**
 * Builds a Yup schema for one wizard step only.
 *
 * Formik always validates the full form values against `validationSchema`. If this
 * included every step's fields, blur and Next would fail on steps the user has not
 * reached yet (for example, empty networking while still on General). Returning
 * only the active step's fields keeps validation scoped to the current step.
 */
export const buildComputeInstanceStepSchema = (
  stepId: VmWizardStepId,
  t: TFunction,
): yup.AnyObjectSchema | undefined => {
  // Review has no editable fields; Create provisions without Formik validation.
  if (stepId === 'review') {
    return undefined;
  }

  const fields = buildComputeInstanceFieldDefinitions(t);

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
          sshKey: yup.object({ name: yup.string() }),
        }),
      });
    case 'configuration':
      return yup.object({
        spec: yup.object({
          instanceType: fields.specInstanceType,
          userData: fields.specUserData,
        }),
      });
    case 'storage':
      return yup.object({
        spec: yup.object({
          bootDisk: fields.specBootDisk,
          additionalDisks: fields.specAdditionalDisks,
        }),
      });
    case 'networking':
      return yup.object({
        spec: yup.object({
          networking: fields.specNetworking,
        }),
      });
    default:
      return undefined;
  }
};
