import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSection, PageSectionTypes, Wizard, WizardStep } from '@patternfly/react-core';
import { FormikProvider, useFormik } from 'formik';

import { ClusterCatalogItem } from '@osac/types';
import { useProvisionCluster } from '@osac/ui-components/api/v1/cluster';
import { useClusterCatalogItems } from '@osac/ui-components/api/v1/cluster-catalog-item';
import { FieldValidationProvider } from '@osac/ui-components/components/Form/FieldValidationContext';
import LeaveFormConfirmation from '@osac/ui-components/components/Form/LeaveFormConfirmation';
import { CatalogStep } from '@osac/ui-components/components/ProvisioningWizard/CatalogStep';
import { OSACWizardFooter } from '@osac/ui-components/components/Wizard/OSACWizardFooter';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import ClusterConfigurationStep from './ClusterConfigurationStep';
import ClusterGeneralStep from './ClusterGeneralStep';
import { ClusterNetworkingStep } from './ClusterNetworkingStep';
import { ClusterReviewStep } from './ClusterReviewStep';
import type { ClusterWizardValues } from './fields';
import { buildClusterCreatePayload, getClusterInitialValues } from './payload';
import { buildClusterStepSchema } from './schemas';
import type { CatalogItem } from '../../catalog/catalogItemDisplay';

export interface ClusterCreateWizardCloseHandler {
  requestClose: () => void;
  pending: boolean;
}

interface Props {
  initialCatalogItemId?: string;
  onCloseHandlerChange?: (handler: ClusterCreateWizardCloseHandler) => void;
  onClosed?: () => void;
}

const ClusterWizardBody = ({
  stepId,
  catalogItem,
}: {
  stepId: string;
  catalogItem: ClusterCatalogItem | null;
}) => {
  if (stepId === 'catalog') {
    return null;
  }
  if (stepId === 'general') {
    return <ClusterGeneralStep catalogItem={catalogItem} />;
  }
  if (stepId === 'configuration') {
    return <ClusterConfigurationStep catalogItem={catalogItem} />;
  }
  if (stepId === 'networking') {
    return <ClusterNetworkingStep catalogItem={catalogItem} />;
  }
  return <ClusterReviewStep catalogItem={catalogItem} />;
};

const ClusterWizardContent = ({ initialCatalogItemId, onCloseHandlerChange, onClosed }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const provision = useProvisionCluster();
  const catalogQuery = useClusterCatalogItems();
  const [activeStep, setActiveStep] = useState('catalog');
  const [validationAlert, setValidationAlert] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<ClusterCatalogItem | null>(null);
  const catalogItems = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const steps = ['catalog', 'general', 'configuration', 'networking', 'review'] as const;

  const handleSubmit = useCallback(
    async (values: ClusterWizardValues) => {
      if (!selectedCatalogItem) {
        throw new Error(t('catalogProvision.validation.catalogItemRequired'));
      }
      const created = await provision.mutateAsync(
        buildClusterCreatePayload(values, selectedCatalogItem),
      );
      if (!created?.id) {
        throw new Error('Create response missing id');
      }
      navigate(`/clusters/${created.id}`);
    },
    [navigate, provision, selectedCatalogItem, t],
  );

  const validationSchema = useMemo(
    () => buildClusterStepSchema(selectedCatalogItem, activeStep, t),
    [activeStep, selectedCatalogItem, t],
  );

  const formik = useFormik<ClusterWizardValues>({
    initialValues: getClusterInitialValues(),
    validationSchema,
    onSubmit: handleSubmit,
    validateOnChange: false,
  });

  const handleCatalogItemSelected = useCallback(
    (item: CatalogItem) => {
      const computeItem = item as ClusterCatalogItem;
      setSelectedCatalogItem(computeItem);
      formik.resetForm({ values: getClusterInitialValues(computeItem) });
    },
    [formik],
  );

  const pending = formik.isSubmitting;

  useEffect(() => {
    const item = catalogItems.find((entry) => entry.id === initialCatalogItemId);
    if (item && !selectedCatalogItem) {
      setSelectedCatalogItem(item);
      formik.resetForm({ values: getClusterInitialValues(item) });
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
      const schema = buildClusterStepSchema(selectedCatalogItem, stepId, t);
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
                  <ClusterWizardBody stepId={step} catalogItem={selectedCatalogItem} />
                )}
              </WizardStep>
            ))}
          </Wizard>
        </PageSection>
      </FieldValidationProvider>
    </FormikProvider>
  );
};

const ClusterCreateWizard = (props: Props) => <ClusterWizardContent {...props} />;

export default ClusterCreateWizard;
