import { type MessageInitShape } from '@bufbuild/protobuf';

import { BareMetalInstanceSchema, ClusterSchema, ComputeInstanceSchema } from '@osac/types';

import { BareMetalInstanceWizardValues } from '../BareMetalInstance/CreateWizard/fields';
import type { ClusterWizardValues } from '../Cluster/CreateWizard/fields';
import type { ComputeInstanceWizardValues } from '../vm/CreateWizard/fields';

export type CatalogProvisionPayload =
  | MessageInitShape<typeof ComputeInstanceSchema>
  | MessageInitShape<typeof ClusterSchema>
  | MessageInitShape<typeof BareMetalInstanceSchema>;

export type CatalogProvisionWizardValues =
  | ComputeInstanceWizardValues
  | ClusterWizardValues
  | BareMetalInstanceWizardValues;
