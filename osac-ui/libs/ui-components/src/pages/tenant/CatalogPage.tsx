import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  Content,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  SearchInput,
  Stack,
  StackItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import type { TFunction } from 'i18next';

import { ServiceTier } from '@osac/types';
import { type CatalogListFilterCriteria } from '@osac/ui-components/api/v1/catalog-item-list-filter';
import {
  type CatalogItemKind,
  isCatalogItemKind,
  isCatalogPublishedFilter,
} from '@osac/ui-components/components/catalog/catalogItemDisplay';
import {
  CATALOG_ITEMS_VIEW_KEY,
  CatalogItemListSection,
} from '@osac/ui-components/components/catalog/CatalogItemListSection';
import CatalogPublishedStatusFilter from '@osac/ui-components/components/catalog/CatalogPublishedStatusFilter';
import CatalogServiceTierFilter from '@osac/ui-components/components/catalog/CatalogServiceTierFilter';
import CatalogTenantFilter from '@osac/ui-components/components/catalog/CatalogTenantFilter';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton';
import FieldSeparator from '@osac/ui-components/components/Primitives/FieldSeparator';
import ViewSwitcher from '@osac/ui-components/components/Primitives/ViewSwitcher';
import { useCatalogItems } from '@osac/ui-components/hooks/use-catalog-items';
import { SEARCH_PARAM, usePageFilter } from '@osac/ui-components/hooks/use-page-filter';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { UserRole } from '@osac/ui-components/shellTypes';

const getPageDescription = (t: TFunction, enabledServices: ServiceTier[], role: UserRole) => {
  const hasBareMetal = enabledServices.includes(ServiceTier.BMAAS);
  const hasClusters = enabledServices.includes(ServiceTier.CAAS);
  const hasVirtualMachines = enabledServices.includes(ServiceTier.VMAAS);

  if (hasVirtualMachines && hasClusters && hasBareMetal) {
    if (role === 'admin') {
      return t(
        'Create catalog items from master templates across virtual machines, clusters, or bare metal machines, then attach them to tenants.',
      );
    }
    return t(
      'Browse catalog items and launch virtual machines, clusters, or bare metal machines from published offerings.',
    );
  }

  if (hasVirtualMachines && hasClusters) {
    if (role === 'admin') {
      return t(
        'Create catalog items from master templates across virtual machines or clusters, then attach them to tenants.',
      );
    }
    return t(
      'Browse catalog items and launch virtual machines or clusters from published offerings.',
    );
  }

  if (hasVirtualMachines && hasBareMetal) {
    if (role === 'admin') {
      return t(
        'Create catalog items from master templates across virtual machines or bare metal machines, then attach them to tenants.',
      );
    }
    return t(
      'Browse catalog items and launch virtual machines or bare metal machines from published offerings.',
    );
  }

  if (hasClusters && hasBareMetal) {
    if (role === 'admin') {
      return t(
        'Create catalog items from master templates across clusters or bare metal machines, then attach them to tenants.',
      );
    }
    return t(
      'Browse catalog items and launch clusters or bare metal machines from published offerings.',
    );
  }

  if (hasVirtualMachines) {
    if (role === 'admin') {
      return t(
        'Create catalog items from master templates for virtual machines, then attach them to tenants.',
      );
    }
    return t('Browse catalog items and launch virtual machines from published offerings.');
  }

  if (hasClusters) {
    if (role === 'admin') {
      return t(
        'Create catalog items from master templates for clusters, then attach them to tenants.',
      );
    }
    return t('Browse catalog items and launch clusters from published offerings.');
  }

  if (hasBareMetal) {
    if (role === 'admin') {
      return t(
        'Create catalog items from master templates for bare metal machines, then attach them to tenants.',
      );
    }
    return t('Browse catalog items and launch bare metal machines from published offerings.');
  }

  if (role === 'admin') {
    return t('Create catalog items from master templates, then attach them to tenants.');
  }
  return t('Browse catalog items and launch them from published offerings.');
};

const TYPE_FILTER_PARAM = 'types';

// Priority order for the default resource type when the URL has none selected.
const CATALOG_SERVICE_TIER_PRIORITY: ServiceTier[] = [
  ServiceTier.BMAAS,
  ServiceTier.CAAS,
  ServiceTier.VMAAS,
];

const catalogKindForServiceTier = (tier: ServiceTier): CatalogItemKind | undefined => {
  switch (tier) {
    case ServiceTier.BMAAS:
      return 'bm';
    case ServiceTier.CAAS:
      return 'cluster';
    case ServiceTier.VMAAS:
      return 'vm';
    default:
      return undefined;
  }
};

const serviceTierForFilter = (filter?: string): ServiceTier | undefined => {
  switch (filter) {
    case 'bm':
      return ServiceTier.BMAAS;
    case 'vm':
      return ServiceTier.VMAAS;
    case 'cluster':
      return ServiceTier.CAAS;
    default:
      return undefined;
  }
};

const PUBLISHED_FILTER_PARAM = 'published';
const TENANT_FILTER_PARAM = 'tenant';

const CatalogPage = () => {
  const { enabledServices, role } = useSession();
  const { t } = useTranslation();
  const [typeFilterParam, setTypeFilterParam] = usePageFilter(TYPE_FILTER_PARAM);
  const [, setSearchParams] = useSearchParams();
  const [publishedFilterParam, setPublishedFilterParam] = usePageFilter(PUBLISHED_FILTER_PARAM);
  const [tenantFilter, setTenantFilter] = usePageFilter(TENANT_FILTER_PARAM);
  const [searchFilter, setSearchFilter] = usePageFilter(SEARCH_PARAM);
  const publishedFilter = isCatalogPublishedFilter(publishedFilterParam)
    ? publishedFilterParam
    : undefined;
  const isFiltered = publishedFilter || tenantFilter || searchFilter;

  // The URL may carry several comma-separated kinds from an older multi-select
  // link; keep the first one that is both a valid kind and currently enabled.
  const requestedKind = useMemo<CatalogItemKind | undefined>(() => {
    for (const raw of typeFilterParam.split(',')) {
      const trimmed = raw.trim();
      if (!isCatalogItemKind(trimmed)) {
        continue;
      }
      const tier = serviceTierForFilter(trimmed);
      if (tier && enabledServices.includes(tier)) {
        return trimmed;
      }
    }
    return undefined;
  }, [typeFilterParam, enabledServices]);

  const defaultKind = useMemo<CatalogItemKind | undefined>(() => {
    for (const tier of CATALOG_SERVICE_TIER_PRIORITY) {
      if (enabledServices.includes(tier)) {
        return catalogKindForServiceTier(tier);
      }
    }
    return undefined;
  }, [enabledServices]);

  const selectedKind = requestedKind ?? defaultKind;
  const selectedServiceTier = selectedKind ? serviceTierForFilter(selectedKind) : undefined;

  const filterCriteria = useMemo<CatalogListFilterCriteria>(
    () => ({
      search: searchFilter,
      published: publishedFilter,
      tenant: tenantFilter,
    }),
    [publishedFilter, searchFilter, tenantFilter],
  );

  const serviceTierFilter: ServiceTier[] = useMemo(
    () => (selectedServiceTier ? [selectedServiceTier] : []),
    [selectedServiceTier],
  );

  const {
    vms,
    bms,
    clusters,
    isLoading,
    error,
    hasSuccessfulQuery,
    typeCounts,
    unfilteredTotalItems,
  } = useCatalogItems(filterCriteria, serviceTierFilter, false);

  const data = [...vms, ...clusters, ...bms];

  const showFullCatalogCount = data.length === unfilteredTotalItems && !isFiltered;

  const showEmptyState = !isLoading && !error && data.length === 0;

  const pageDescription = getPageDescription(t, enabledServices, role);

  const canCreateCatalogItem = (role === 'admin' || role === 'tenant-admin') && !!selectedKind;

  // react-router's setSearchParams does not compose across synchronous calls;
  // each updater receives the render-captured params. Clear every filter in one
  // update so none of them is overwritten.
  const clearAllFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(TYPE_FILTER_PARAM);
        next.delete(PUBLISHED_FILTER_PARAM);
        next.delete(TENANT_FILTER_PARAM);
        next.delete(SEARCH_PARAM);
        return next;
      },
      { replace: true },
    );
  };

  const renderEmptyState = () => {
    if (unfilteredTotalItems === 0) {
      return (
        <EmptyState titleText={t('No catalog items found')} headingLevel="h2">
          {enabledServices.length === 0 ? (
            <EmptyStateBody>{t('No catalog services are enabled.')}</EmptyStateBody>
          ) : (
            <EmptyStateBody>{t('No catalog items are available yet.')}</EmptyStateBody>
          )}
        </EmptyState>
      );
    }

    return (
      <EmptyState titleText={t('No catalog items match your filters')} headingLevel="h2">
        <EmptyStateBody>
          {t('Try a different service, publish status, tenant, or search term.')}{' '}
          <Button variant="link" isInline onClick={clearAllFilters}>
            {t('Clear all filters')}
          </Button>
        </EmptyStateBody>
      </EmptyState>
    );
  };

  return (
    <ListPage
      title={t('Catalog')}
      description={pageDescription}
      actions={
        canCreateCatalogItem ? (
          <CreateButton to={`/catalog/${selectedKind}/create`}>
            {t('Create catalog item')}
          </CreateButton>
        ) : null
      }
    >
      <Stack hasGutter>
        <StackItem>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <CatalogServiceTierFilter
                  selected={selectedServiceTier}
                  typeCounts={typeCounts}
                  onSelect={(tier) => {
                    const kind = catalogKindForServiceTier(tier);
                    if (kind) {
                      setTypeFilterParam(kind);
                    }
                  }}
                />
              </ToolbarItem>
              {role === 'admin' || role === 'tenant-admin' ? (
                <ToolbarItem>
                  <CatalogPublishedStatusFilter
                    selected={publishedFilter}
                    onChange={(value) => setPublishedFilterParam(value ?? '')}
                  />
                </ToolbarItem>
              ) : null}
              {role === 'admin' ? (
                <ToolbarItem>
                  <CatalogTenantFilter
                    selected={tenantFilter}
                    onChange={(value) => setTenantFilter(value ?? '')}
                  />
                </ToolbarItem>
              ) : null}
              <ToolbarItem>
                <SearchInput
                  placeholder={t('Search catalog items')}
                  value={searchFilter}
                  onChange={(_event, value) => setSearchFilter(value)}
                  onClear={() => setSearchFilter('')}
                  aria-label={t('Filter catalog by keyword')}
                  isDisabled={!hasSuccessfulQuery}
                />
              </ToolbarItem>
              <ToolbarGroup align={{ default: 'alignEnd' }}>
                <ToolbarItem>
                  <ViewSwitcher pageKey={CATALOG_ITEMS_VIEW_KEY} />
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>
        </StackItem>
        {showEmptyState ? (
          <StackItem>{renderEmptyState()}</StackItem>
        ) : (
          <>
            <StackItem>
              <Flex gap={{ default: 'gapXs' }}>
                <FlexItem>
                  <Content className="pf-v6-u-font-weight-bold">
                    {showFullCatalogCount
                      ? t('{{count}} catalog item', { count: unfilteredTotalItems })
                      : t('{{shown}} of {{count}} catalog item', {
                          shown: data.length,
                          count: unfilteredTotalItems,
                        })}
                  </Content>
                </FlexItem>
                {isFiltered ? (
                  <>
                    <FlexItem>
                      <FieldSeparator />
                    </FlexItem>
                    <FlexItem>
                      <Button variant="link" isInline onClick={clearAllFilters}>
                        {t('Clear all filters')}
                      </Button>
                    </FlexItem>
                  </>
                ) : null}
              </Flex>
            </StackItem>
            <StackItem>
              <CatalogItemListSection items={data} isLoading={isLoading} error={error} />
            </StackItem>
          </>
        )}
      </Stack>
    </ListPage>
  );
};

export default CatalogPage;
