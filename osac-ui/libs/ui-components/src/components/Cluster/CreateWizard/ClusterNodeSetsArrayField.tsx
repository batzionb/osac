import { ActionGroup, Alert, Button, Stack, StackItem } from '@patternfly/react-core';
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useField } from 'formik';

import { BareMetalInstanceTypes } from '@osac/types';
import { useListResource } from '@osac/ui-components/api/use-resource';

import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import ClusterPoolSizeField from '../../Form/ClusterPoolSizeField';
import NameField from '../../Form/NameField';
import { SelectField } from '../../Form/SelectField';
import ProvisioningFieldGroup from '../../ProvisioningWizard/fields/ProvisioningFieldGroup';
import type { ProvisioningFieldControlProps } from '../../ProvisioningWizard/fields/provisioningFieldValue';
import type { ClusterNodeSetRow } from './fields';
import { createEmptyNodeSetRow } from './fields';

const ClusterNodeSetsArrayField = ({
  name = '',
  isDisabled = false,
}: ProvisioningFieldControlProps) => {
  const { t } = useTranslation();
  const [field, , helpers] = useField<ClusterNodeSetRow[]>(name);
  const rows = field.value ?? [];
  const {
    data: hostTypes,
    isLoading: hostTypesLoading,
    error: hostTypesError,
    refetch: refetchHostTypes,
  } = useListResource(BareMetalInstanceTypes);

  const hostTypeOptions = (hostTypes?.items || []).map((hostType) => ({
    value: hostType.id,
    label: hostType.metadata?.name || '',
  }));

  const addRow = () => {
    void helpers.setValue([...rows, createEmptyNodeSetRow()]);
  };

  const removeRow = (rowIndex: number) => {
    void helpers.setValue(rows.filter((_, index) => index !== rowIndex));
  };

  return (
    <Stack hasGutter>
      {hostTypesError ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('Could not load host types')}>
            {getErrorMessage(hostTypesError)}
            <Button variant="link" isInline onClick={() => void refetchHostTypes()}>
              {t('catalogProvision.actions.retry')}
            </Button>
          </Alert>
        </StackItem>
      ) : null}
      {rows.length === 0 ? <StackItem>{t('No node sets added yet.')}</StackItem> : null}
      {rows.map((row, rowIndex) => (
        <StackItem key={row.rowId}>
          <ProvisioningFieldGroup
            title={t('Node set {{number}}', { number: rowIndex + 1 })}
            titleId={`cluster-node-set-group-${row.rowId}`}
            actions={
              !isDisabled && rowIndex > 0 ? (
                <Button
                  variant="plain"
                  aria-label={t('Remove node set')}
                  onClick={() => removeRow(rowIndex)}
                  icon={<MinusCircleIcon />}
                />
              ) : undefined
            }
          >
            <NameField
              name={`${name}.${rowIndex}.name`}
              fieldId={`cluster-node-set-name-${row.rowId}`}
              isDisabled={isDisabled}
            />
            <SelectField
              name={`${name}.${rowIndex}.hostType`}
              label={t('Host type')}
              fieldId={`cluster-host-type-${row.rowId}`}
              options={hostTypeOptions}
              isRequired
              isLoading={hostTypesLoading}
              placeholder={t('Select host type')}
              isDisabled={isDisabled}
            />
            <ClusterPoolSizeField
              name={`${name}.${rowIndex}.size`}
              fieldId={`cluster-node-set-size-${rowIndex}`}
              isRequired
              isDisabled={isDisabled}
            />
          </ProvisioningFieldGroup>
        </StackItem>
      ))}
      {isDisabled ? null : (
        <StackItem>
          <ActionGroup>
            <Button
              variant="link"
              icon={<PlusCircleIcon />}
              onClick={addRow}
              isDisabled={hostTypesLoading}
            >
              {t('Add node set')}
            </Button>
          </ActionGroup>
        </StackItem>
      )}
    </Stack>
  );
};

export default ClusterNodeSetsArrayField;
