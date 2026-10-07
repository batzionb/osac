import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSection, PageSectionTypes, Wizard, WizardStep } from '@patternfly/react-core';
import { FormikProvider, useFormik } from 'formik';

import { ComputeInstanceCatalogItem } from '@osac/types';
import { useProvisionComputeInstance } from '@osac/ui-components/api/v1/compute-instance';
import { useComputeInstanceCatalogItems } from '@osac/ui-components/api/v1/compute-instance-catalog-item';
import { FieldValidationProvider } from '@osac/ui-components/components/Form/FieldValidationContext';
import LeaveFormConfirmation from '@osac/ui-components/components/Form/LeaveFormConfirmation';
import { CatalogStep } from '@osac/ui-components/components/ProvisioningWizard/CatalogStep';
import { OSACWizardFooter } from '@osac/ui-components/components/Wizard/OSACWizardFooter';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { applyVmCatalogConfigurationDefaults } from './applyCatalogDefaults';
import { applyVmCatalogGeneralDefaults } from './applyCatalogGeneralDefaults';
import type { ComputeInstanceWizardValues } from './fields';
import { buildComputeInstanceCreatePayload, createEmptyComputeInstanceValues } from './payload';
import { buildComputeInstanceStepSchema } from './schemas';
import { VmConfigurationStep } from './VmConfigurationStep';
import VmGeneralStep from './VmGeneralStep';
import { VmNetworkingStep } from './VmNetworkingStep';
import { VmReviewStep } from './VmReviewStep';
import { VmStorageStep } from './VmStorageStep';
import type { CatalogItem } from '../../catalog/catalogItemDisplay';

export interface VmCreateWizardCloseHandler {
  requestClose: () => void;
  pending: boolean;
}

interface Props {
  initialCatalogItemId?: string;
  onCloseHandlerChange?: (handler: VmCreateWizardCloseHandler) => void;
  onClosed?: () => void;
}

const VmWizardBody = ({
  stepId,
  catalogItem,
}: {
  stepId: string;
  catalogItem: ComputeInstanceCatalogItem | null;
}) => {
  if (stepId === 'catalog') {
    return null;
  }
  if (stepId === 'general') {
    return <VmGeneralStep catalogItem={catalogItem} />;
  }
  if (stepId === 'configuration') {
    return <VmConfigurationStep catalogItem={catalogItem} />;
  }
  if (stepId === 'storage') {
    return <VmStorageStep catalogItem={catalogItem} />;
  }
  if (stepId === 'networking') {
    return <VmNetworkingStep catalogItem={catalogItem} />;
  }
  return <VmReviewStep catalogItem={catalogItem} />;
};

const VmWizardContent = ({ initialCatalogItemId, onCloseHandlerChange, onClosed }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const provision = useProvisionComputeInstance();
  const catalogQuery = useComputeInstanceCatalogItems();
  const [activeStep, setActiveStep] = useState('catalog');
  const [validationAlert, setValidationAlert] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<ComputeInstanceCatalogItem | null>(
    null,
  );
  const catalogItems = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const steps = ['catalog', 'general', 'configuration', 'storage', 'networking', 'review'] as const;

  const handleSubmit = useCallback(
    async (values: ComputeInstanceWizardValues) => {
      if (!selectedCatalogItem) {
        throw new Error(t('catalogProvision.validation.catalogItemRequired'));
      }
      const created = await provision.mutateAsync(
        buildComputeInstanceCreatePayload(values, selectedCatalogItem),
      );
      if (!created?.id) {
        throw new Error('Create response missing id');
      }
      navigate(`/vms/${created.id}`);
    },
    [navigate, provision, selectedCatalogItem, t],
  );

  const validationSchema = useMemo(
    () => buildComputeInstanceStepSchema(selectedCatalogItem, activeStep, t),
    [activeStep, selectedCatalogItem, t],
  );

  const formik = useFormik<ComputeInstanceWizardValues>({
    initialValues: createEmptyComputeInstanceValues(),
    validationSchema,
    onSubmit: handleSubmit,
    validateOnChange: false,
  });

  const handleCatalogItemSelected = useCallback(
    (item: CatalogItem) => {
      const computeItem = item as ComputeInstanceCatalogItem;
      setSelectedCatalogItem(computeItem);
      formik.resetForm({
        values: { ...createEmptyComputeInstanceValues(), catalogItemId: item.id },
      });
      applyVmCatalogConfigurationDefaults(computeItem, formik, t);
      applyVmCatalogGeneralDefaults(computeItem, formik);
    },
    [formik, t],
  );

  const pending = formik.isSubmitting;

  useEffect(() => {
    const item = catalogItems.find((entry) => entry.id === initialCatalogItemId);
    if (item && !selectedCatalogItem) {
      setSelectedCatalogItem(item);
      void formik.setFieldValue('catalogItemId', item.id, false);
      void applyVmCatalogConfigurationDefaults(item, formik, t);
      applyVmCatalogGeneralDefaults(item, formik);
    }
  }, [catalogItems, formik, initialCatalogItemId, selectedCatalogItem, t]);

  const requestClose = useCallback(() => {
    if (!pending) {
      onClosed?.();
    }
  }, [onClosed, pending]);

  useEffect(() => {
    onCloseHandlerChange?.({ requestClose, pending });
  }, [onCloseHandlerChange, pending, requestClose]);

  const stepHasErrors = useCallback(
    (stepId: string, errors: Record<string, unknown>) => {
      const schema = buildComputeInstanceStepSchema(selectedCatalogItem, stepId, t);
      return Boolean(schema && Object.keys(errors).length > 0);
    },
    [selectedCatalogItem, t],
  );

  return (
    <FormikProvider value={formik}>
      <FieldValidationProvider showErrors={validationAlert}>
        <LeaveFormConfirmation />
        <PageSection hasBodyWrapper={false} type={PageSectionTypes.wizard}>
          <Wizard
            isVisitRequired
            onStepChange={(_, step) => {
              setActiveStep(String(step.id));
              setValidationAlert(false);
            }}
            footer={
              <OSACWizardFooter
                onCancel={requestClose}
                stepHasErrors={stepHasErrors}
                error={provision.error}
                onErrorReset={provision.reset}
              />
            }
          >
            {steps.map((step) => (
              <WizardStep
                key={step}
                id={step}
                name={step === 'catalog' ? t('Catalog item') : t(step)}
              >
                {step === 'catalog' ? (
                  <CatalogStep
                    catalogItems={catalogItems}
                    catalogLoading={catalogQuery.isPending}
                    catalogError={catalogQuery.isError}
                    refetchCatalogItems={() => void catalogQuery.refetch()}
                    onCatalogItemSelected={handleCatalogItemSelected}
                  />
                ) : (
                  <VmWizardBody stepId={step} catalogItem={selectedCatalogItem} />
                )}
              </WizardStep>
            ))}
          </Wizard>
        </PageSection>
      </FieldValidationProvider>
    </FormikProvider>
  );
};

const VmCreateWizard = (props: Props) => <VmWizardContent {...props} />;

export default VmCreateWizard;
