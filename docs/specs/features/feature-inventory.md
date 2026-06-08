# Feature Inventory Normalizado

## Domain -> Feature Matrix

| Domain | Feature | Status |
|---|---|---|
| Identity & Access | Login | Implemented |
| Identity & Access | Session refresh | Implemented |
| Identity & Access | Route protection | Implemented |
| Identity & Access | Logout | Implemented |
| Work Orders | Batch digital work-order number preview | Implemented |
| Work Orders | Batch digital draft creation | Implemented |
| Work Orders | Work-order validation, calculations and investor split | Implemented |
| Work Orders | Save confirmation after draft creation | Implemented |
| Work Orders | Draft list/search/pagination/sort/filter | Implemented |
| Work Orders | Draft detail and group detail | Implemented |
| Work Orders | Draft edit/update | Implemented |
| Work Orders | Published draft read-only behavior | Implemented |
| Work Orders | PDF data, generation, download and share | Implemented |
| Work Orders | Single draft creation path | Partially Implemented |
| Work Orders | Mobile publish action | Stubbed |
| Project Context | Customer, campaign and project selection | Implemented |
| Project Context | Project detail selection | Implemented |
| Project Context | Field, lot and crop selection from project detail | Implemented |
| Project Context | Standalone field-by-project client | Stubbed |
| Operations Catalog | Labor lookup and contractor autofill | Implemented |
| Operations Catalog | Pending inline labor creation | Implemented |
| Operations Catalog | Full inline labor creation | Stubbed |
| Operations Catalog | Supply lookup | Implemented |
| Operations Catalog | Pending supply creation | Implemented |
| Operations Catalog | Drawer/new supply button behavior | Stubbed |
| Inventory | Stock lookup and stock annotation | Implemented |
| Platform & Delivery | Health and version endpoints | Implemented |
| Platform & Delivery | Docker/Firebase/Cloud Run deployment configuration | Implemented |
| Platform & Delivery | GitHub Actions CI/CD workflows | Implemented |
| Platform & Delivery | Promote and rollback workflows | Implemented |
| Platform & Delivery | Authenticated release smoke | Planned |
| Platform & Delivery | Live GCP/GitHub environment state | UNKNOWN |
| Frontend Shell | App routing and navigation | Implemented |
| Frontend Shell | Authenticated layout | Implemented |
| Frontend Shell | Browser session storage | Implemented |

## Feature -> API Matrix

| Feature | APIs |
|---|---|
| Login | `POST /api/v1/auth/login` |
| Session refresh | `GET /api/v1/auth/access-token` |
| Route protection | None; frontend behavior |
| Logout | None; frontend behavior |
| Batch digital work-order number preview | `POST /api/v1/work-order-drafts/digital/batch/preview-number` |
| Batch digital draft creation | `POST /api/v1/work-order-drafts/digital/batch` |
| Work-order validation, calculations and investor split | None direct; client-side behavior before draft APIs |
| Save confirmation after draft creation | `POST /api/v1/work-order-drafts/digital/batch` |
| Draft list/search/pagination/sort/filter | `GET /api/v1/work-order-drafts/digital/groups`, `GET /api/v1/work-order-drafts/digital` |
| Draft detail and group detail | `GET /api/v1/work-order-drafts/:id`, `GET /api/v1/work-order-drafts/:id/group` |
| Draft edit/update | `PUT /api/v1/work-order-drafts/:id`, `PUT /api/v1/work-order-drafts/:id/group` |
| Published draft read-only behavior | Draft detail APIs |
| PDF data, generation, download and share | `GET /api/v1/work-order-drafts/:id/pdf-data`, `GET /api/v1/work-order-drafts/:id/group-pdf-data` |
| Single draft creation path | `POST /api/v1/work-order-drafts/digital`, `POST /api/v1/work-order-drafts/digital/preview-number` |
| Mobile publish action | `POST /api/v1/work-order-drafts/:id/publish`; UI blocks publish from mobile |
| Customer, campaign and project selection | `GET /api/v1/customers`, `GET /api/v1/campaigns`, `GET /api/v1/projects` |
| Project detail selection | `GET /api/v1/projects/:id` |
| Field, lot and crop selection from project detail | `GET /api/v1/projects/:id` |
| Standalone field-by-project client | No canonical API; client path is stubbed |
| Labor lookup and contractor autofill | `GET /api/v1/labors?project_id=...`, `GET /api/v1/projects/:id/labors` |
| Pending inline labor creation | `POST /api/v1/projects/:id/labors/pending` |
| Full inline labor creation | `GET /api/v1/categories`, `POST /api/v1/projects/:id/labors` |
| Supply lookup | `GET /api/v1/supplies?project_id=...` |
| Pending supply creation | `POST /api/v1/supplies/pending` |
| Drawer/new supply button behavior | No canonical API; button behavior is stubbed |
| Stock lookup and stock annotation | `GET /api/v1/stock/:projectId` |
| Health and version endpoints | `GET /health`, `GET /api/v1/version` |
| Docker/Firebase/Cloud Run deployment configuration | None; infrastructure config |
| GitHub Actions CI/CD workflows | None; workflow files |
| Promote and rollback workflows | None; workflow files |
| Authenticated release smoke | None implemented |
| Live GCP/GitHub environment state | UNKNOWN |
| App routing and navigation | None; frontend behavior |
| Authenticated layout | None; frontend behavior |
| Browser session storage | None; browser-local behavior |

## Feature -> Database Matrix

| Feature | Data / Entity | Storage classification |
|---|---|---|
| Login | Identity user | Google Identity Platform external |
| Session refresh | Access/refresh token | Google Identity Platform external + browser-local session |
| Route protection | Browser session state | Browser-local |
| Logout | Browser session state | Browser-local |
| Work-order features | Work order draft, draft group, PDF data, investor contribution | External Manager API / UNKNOWN database |
| Project context features | Customer, campaign, project, project detail, field, lot, crop | External Manager API / UNKNOWN database |
| Operations catalog features | Labor, labor category, contractor, supply, pending supply | External Manager API / UNKNOWN database |
| Inventory features | Stock item, stock snapshot, stock annotation | External Manager API / UNKNOWN database |
| Platform features | Deployment release, artifact image, Firebase site, Cloud Run service, secret reference | External infrastructure / UNKNOWN live state |
| Frontend Shell features | Route, navigation item, browser session state | Local code + browser-local state |

## Feature -> Integration Matrix

| Feature group | Integrations |
|---|---|
| Identity & Access features | Google Identity Platform, Secure Token API |
| Work Orders features | External Manager API, jsPDF, Web Share API, Browser Blob/Object URL APIs |
| Project Context features | External Manager API |
| Operations Catalog features | External Manager API |
| Inventory features | External Manager API |
| Platform & Delivery features | Firebase Hosting, Cloud Run, GitHub Actions, GitHub Deployments, Secret Manager UNKNOWN |
| Frontend Shell features | Browser storage, React Router |

## Excluded From Implemented Scope

| Item | Status | Reason |
|---|---|---|
| `/api/v1/work-orders/:id` client path | Stubbed | Client exists but no BFF route is canonical |
| `/api/v1/projects/:id/fields` client path | Stubbed | Client exists but no BFF route is canonical |
| Mobile publish action | Stubbed | UI intentionally blocks mobile publish |
| Authenticated release smoke | Planned | Specs/scripts mention intent, but no implemented authenticated smoke flow is verified |
| External database schema | UNKNOWN | No migrations/repositories in this repo |
