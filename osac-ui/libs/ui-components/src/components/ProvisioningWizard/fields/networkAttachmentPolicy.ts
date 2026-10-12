import type { ProvisioningFieldValue } from './provisioningFieldValue';
import { provisioningFieldFromPolicy, provisioningFieldValue } from './provisioningFieldValue';
import type { FieldPolicyLike } from '../../catalog/catalogFieldPolicyDisplay';
import { catalogFieldPolicyLocked } from '../../catalog/catalogFieldPolicyDisplay';
import type { ResourceSelectValue } from '../../Form/resourceSelectValue';
import { emptyResourceSelectValue } from '../../Form/resourceSelectValue';

interface AttachmentLike {
  subnet?: { id?: string; name?: string };
  securityGroups?: { id?: string; name?: string }[];
}

export interface NetworkAttachmentFormFields {
  useDefaultNetwork: ProvisioningFieldValue<boolean>;
  virtualNetwork: ProvisioningFieldValue<ResourceSelectValue>;
  subnet: ProvisioningFieldValue<ResourceSelectValue>;
  securityGroups: ProvisioningFieldValue<ResourceSelectValue[]>;
}

export const boolFieldFromPolicy = (
  policy?: FieldPolicyLike & {
    behavior?: { case?: string; value?: boolean | { defaultValue?: boolean } };
  },
  fallback = false,
): ProvisioningFieldValue<boolean> => {
  const value =
    policy?.behavior?.case === 'editable'
      ? Boolean(
          (policy.behavior.value as { defaultValue?: boolean } | undefined)?.defaultValue ??
          fallback,
        )
      : policy?.behavior?.case === 'locked'
        ? Boolean(policy.behavior.value)
        : fallback;
  return provisioningFieldFromPolicy(value, policy);
};

export const networkAttachmentFieldsFromPolicy = (
  policy: FieldPolicyLike,
  attachment?: AttachmentLike,
): NetworkAttachmentFormFields => {
  const locked = catalogFieldPolicyLocked(policy);
  const subnetId = attachment?.subnet?.id?.trim() ?? '';
  const hasCustomAttachment = Boolean(subnetId);

  return {
    useDefaultNetwork: provisioningFieldValue(!hasCustomAttachment, locked),
    virtualNetwork: provisioningFieldFromPolicy(emptyResourceSelectValue(), policy),
    subnet: provisioningFieldFromPolicy(
      subnetId
        ? { id: subnetId, name: attachment?.subnet?.name ?? '' }
        : emptyResourceSelectValue(),
      policy,
    ),
    securityGroups: provisioningFieldFromPolicy(
      (attachment?.securityGroups ?? []).map((group) => ({
        id: group.id ?? '',
        name: group.name ?? '',
      })),
      policy,
    ),
  };
};

export const catalogAttachmentFromPolicy = <T>(
  policy:
    | {
        behavior?:
          | { case: 'locked'; value: T }
          | { case: 'editable'; value: { defaultValue?: T } }
          | { case?: undefined; value?: undefined };
      }
    | undefined,
): T | undefined => {
  if (policy?.behavior?.case === 'locked') {
    return policy.behavior.value;
  }
  if (policy?.behavior?.case === 'editable') {
    return policy.behavior.value.defaultValue;
  }
  return undefined;
};
