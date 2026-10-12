# OSAC-6049 Session Handover

## Current branch

`OSAC-6049-simple-provisioning-wizards`

## Completed

- Replaced the adapter-based provisioning flow with independent full-page wizards for VM, Cluster, and BareMetalInstance.
- Moved shared provisioning wizard fields and utilities into `ProvisioningWizard`.
- Fixed stale imports and regenerated the English translation catalog.
- Fixed launch-from-catalog selection: the VM, Cluster, and BareMetalInstance wizards now initialize Formik's `catalogItemId` when opened with a catalog item in the URL.

## Validation

- TypeScript typecheck passes.
- ESLint, Prettier, and i18n consistency checks pass.
- Full test suite passes: 196 files, 1,425 tests.

## CLI status

- Logged in as `testuser` in the Rawagner environment.
- SSH public-key Secret created successfully in tenant `elay-tenant`:
  - Name: `rawagner-ssh-key-osac6049`
  - ID: `01a111c7-a993-7a98-9f56-be02906e4908`
- Creating the BareMetalInstance with the `rawagner-bm-rwtenant` catalog item previously failed because the API resolved the catalog item to the `shared` tenant.

## Next step

Retry the BareMetalInstance flow as `testuser` using the `elay-tenant` tenant and verify that the catalog item and SSH Secret are both visible and authorized. Do not record credentials or private key material in this handover.
