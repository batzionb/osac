import { useField } from 'formik';

import AutoExternalIpField from './AutoExternalIpField';
import ProvisioningField from './ProvisioningField';
import type { ProvisioningFieldValue } from './provisioningFieldValue';
import SecurityGroupsField from './SecurityGroupsField';
import SubnetField from './SubnetField';
import UseDefaultNetworkField from './UseDefaultNetworkField';
import VirtualNetworkField from './VirtualNetworkField';

interface NetworkAttachmentFieldsProps {
  useDefaultNetworkName: string;
  virtualNetworkName: string;
  subnetName: string;
  securityGroupsName: string;
  autoExternalIpName: string;
  fieldIdPrefix: string;
  autoExternalIpHelperText?: string;
}

const NetworkAttachmentFields = ({
  useDefaultNetworkName,
  virtualNetworkName,
  subnetName,
  securityGroupsName,
  autoExternalIpName,
  fieldIdPrefix,
  autoExternalIpHelperText,
}: NetworkAttachmentFieldsProps) => {
  const [{ value: useDefaultNetwork }] =
    useField<ProvisioningFieldValue<boolean>>(useDefaultNetworkName);

  return (
    <>
      <ProvisioningField name={useDefaultNetworkName}>
        {({ valueName, isDisabled }) => (
          <UseDefaultNetworkField
            name={valueName}
            fieldId={`${fieldIdPrefix}-use-default-network`}
            isDisabled={isDisabled}
          />
        )}
      </ProvisioningField>
      {useDefaultNetwork?.value ? null : (
        <>
          <ProvisioningField name={virtualNetworkName}>
            {({ valueName, isDisabled }) => (
              <VirtualNetworkField
                name={valueName}
                fieldId={`${fieldIdPrefix}-virtual-network`}
                subnetName={subnetName}
                securityGroupsName={securityGroupsName}
                isDisabled={isDisabled}
              />
            )}
          </ProvisioningField>
          <ProvisioningField name={subnetName}>
            {({ valueName, isDisabled }) => (
              <SubnetField
                name={valueName}
                fieldId={`${fieldIdPrefix}-subnet`}
                virtualNetworkName={virtualNetworkName}
                isDisabled={isDisabled}
              />
            )}
          </ProvisioningField>
          <ProvisioningField name={securityGroupsName}>
            {({ valueName, isDisabled }) => (
              <SecurityGroupsField
                name={valueName}
                fieldId={`${fieldIdPrefix}-security-groups`}
                virtualNetworkName={virtualNetworkName}
                isDisabled={isDisabled}
              />
            )}
          </ProvisioningField>
        </>
      )}
      <ProvisioningField name={autoExternalIpName}>
        {({ valueName, isDisabled }) => (
          <AutoExternalIpField
            name={valueName}
            fieldId={`${fieldIdPrefix}-auto-external-ip`}
            helperText={autoExternalIpHelperText}
            isDisabled={isDisabled}
          />
        )}
      </ProvisioningField>
    </>
  );
};

export default NetworkAttachmentFields;
