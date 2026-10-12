import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import NetworkAttachmentFields from './NetworkAttachmentFields';
import { provisioningFieldValue } from './provisioningFieldValue';
import { renderWithProviders } from '../../../test-utils/TestProviders';
import { type ResourceSelectValue, emptyResourceSelectValue } from '../../Form/resourceSelectValue';

interface TestFormValues {
  useDefaultNetwork: { value: boolean; locked: boolean };
  autoExternalIp: { value: boolean; locked: boolean };
  virtualNetwork: { value: ResourceSelectValue; locked: boolean };
  subnet: { value: ResourceSelectValue; locked: boolean };
  securityGroups: { value: ResourceSelectValue[]; locked: boolean };
}

const emptyTestValues = (useDefaultNetwork = true, locked = false): TestFormValues => ({
  useDefaultNetwork: provisioningFieldValue(useDefaultNetwork, locked),
  autoExternalIp: provisioningFieldValue(false, locked),
  virtualNetwork: provisioningFieldValue(emptyResourceSelectValue(), locked),
  subnet: provisioningFieldValue(emptyResourceSelectValue(), locked),
  securityGroups: provisioningFieldValue([], locked),
});

const renderFields = (initialValues?: TestFormValues) =>
  renderWithProviders(
    <Formik initialValues={initialValues ?? emptyTestValues()} onSubmit={() => undefined}>
      <NetworkAttachmentFields
        useDefaultNetworkName="useDefaultNetwork"
        virtualNetworkName="virtualNetwork"
        subnetName="subnet"
        securityGroupsName="securityGroups"
        autoExternalIpName="autoExternalIp"
        fieldIdPrefix="test"
      />
    </Formik>,
  );

describe('NetworkAttachmentFields', () => {
  it('renders "use default network" and "auto external IP" checkboxes', () => {
    renderFields();

    expect(
      screen.getByRole('checkbox', { name: 'Use tenant default network' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Auto External IP Attachment' }),
    ).toBeInTheDocument();
  });

  it('hides VN, Subnet, and Security Groups pickers when default network is checked', () => {
    renderFields();

    expect(screen.getByRole('checkbox', { name: 'Use tenant default network' })).toBeChecked();
    expect(screen.queryByText('Virtual network')).not.toBeInTheDocument();
    expect(screen.queryByText('Subnet')).not.toBeInTheDocument();
    expect(screen.queryByText('Security groups')).not.toBeInTheDocument();
  });

  it('shows VN, Subnet, and Security Groups pickers when default network is unchecked', async () => {
    const user = userEvent.setup();
    renderFields();

    await user.click(screen.getByRole('checkbox', { name: 'Use tenant default network' }));

    expect(screen.getByText('Virtual network')).toBeInTheDocument();
    expect(screen.getByText('Subnet')).toBeInTheDocument();
    expect(screen.getByText('Security groups')).toBeInTheDocument();
  });

  it('hides pickers when toggling default network back on', async () => {
    const user = userEvent.setup();
    renderFields();

    await user.click(screen.getByRole('checkbox', { name: 'Use tenant default network' }));
    expect(screen.getByText('Virtual network')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Use tenant default network' }));
    expect(screen.queryByText('Virtual network')).not.toBeInTheDocument();
  });

  it('renders auto external IP helper text when provided', () => {
    renderWithProviders(
      <Formik initialValues={emptyTestValues()} onSubmit={() => undefined}>
        <NetworkAttachmentFields
          useDefaultNetworkName="useDefaultNetwork"
          virtualNetworkName="virtualNetwork"
          subnetName="subnet"
          securityGroupsName="securityGroups"
          autoExternalIpName="autoExternalIp"
          fieldIdPrefix="test"
          autoExternalIpHelperText="Provision external IPs automatically."
        />
      </Formik>,
    );

    expect(screen.getByText('Provision external IPs automatically.')).toBeInTheDocument();
  });

  it('does not display validation errors on initial render', () => {
    renderFields(emptyTestValues(false));

    expect(screen.queryByText('Virtual network is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Subnet is required')).not.toBeInTheDocument();
  });

  it('disables pickers when catalog policy locks the fields', () => {
    renderFields(emptyTestValues(false, true));

    expect(screen.getByRole('checkbox', { name: 'Use tenant default network' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Auto External IP Attachment' })).toBeDisabled();
    expect(screen.getByLabelText(/^Virtual network/)).toBeDisabled();
    expect(screen.getByLabelText(/^Subnet/)).toBeDisabled();
    expect(screen.getByLabelText(/^Security groups/).closest('.pf-v6-c-menu-toggle')).toHaveClass(
      'pf-m-disabled',
    );
  });
});
