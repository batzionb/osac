import { MessageInitShape, create } from '@bufbuild/protobuf';

import {
  BareMetalInstanceRunStrategy,
  BareMetalInstanceSchema,
  BareMetalNetworkAttachmentSchema,
} from '@osac/types';

import type { BareMetalInstanceWizardValues } from './fields';

export const buildBareMetalInstanceCreatePayload = (
  values: BareMetalInstanceWizardValues,
): MessageInitShape<typeof BareMetalInstanceSchema> => {
  const sshKey = values.spec.sshKey.value.trim();
  const userData = values.spec.userData.value.trim();
  const userDataSecretName = values.spec.userDataSecret.value.trim();

  const bmi: MessageInitShape<typeof BareMetalInstanceSchema> = {
    metadata: { name: values.metadata.name.trim(), project: values.metadata.project },
    spec: {
      catalogItem: {
        id: values.catalogItemId,
      },
      runStrategy: BareMetalInstanceRunStrategy.ALWAYS,
      ...(sshKey && { sshPublicKey: sshKey }),
      ...(values.spec.userDataSource.value === 'secret'
        ? userDataSecretName && { userDataSecret: { name: userDataSecretName } }
        : userData && { userData }),
      ...(values.spec.instanceType.value && {
        instanceType: {
          name: values.spec.instanceType.value,
          shared: true,
        },
      }),
      diskImage: {
        id: values.spec.diskImage.value.id,
      },
    },
  };

  // Add networking configuration
  const networking = values.spec.networking;

  // Only include networkAttachments if custom networking is enabled
  if (!networking.useDefaults.value && networking.attachments.length > 0) {
    bmi.spec = {
      ...bmi.spec,
      networkAttachments: networking.attachments.slice(0, 1).map((attachment) =>
        create(BareMetalNetworkAttachmentSchema, {
          subnet: { id: attachment.subnet.value.id },
          securityGroups: attachment.securityGroups.value.map((sg) => ({ id: sg.id })),
        }),
      ),
    };
  }

  // Add auto external IP attachment if enabled
  if (networking.attachExternalIp.value) {
    bmi.spec = {
      ...bmi.spec,
      autoExternalIpAttachment: true,
    };
  }

  return bmi;
};
