# API Inventory Normalizado

## Canonical BFF APIs

| Method | Path | Domain owner | Status |
|---|---|---|---|
| GET | `/health` | Platform & Delivery | Implemented |
| GET | `/api/v1/version` | Platform & Delivery | Implemented |
| POST | `/api/v1/auth/login` | Identity & Access | Implemented |
| GET | `/api/v1/auth/access-token` | Identity & Access | Implemented |
| GET | `/api/v1/campaigns` | Project Context | Implemented |
| GET | `/api/v1/customers` | Project Context | Implemented |
| GET | `/api/v1/projects` | Project Context | Implemented |
| GET | `/api/v1/projects/:id` | Project Context | Implemented |
| GET | `/api/v1/projects/:id/labors` | Operations Catalog | Implemented |
| POST | `/api/v1/projects/:id/labors` | Operations Catalog | Implemented |
| POST | `/api/v1/projects/:id/labors/pending` | Operations Catalog | Implemented |
| GET | `/api/v1/categories` | Operations Catalog | Implemented |
| GET | `/api/v1/labors` | Operations Catalog | Implemented |
| GET | `/api/v1/supplies` | Operations Catalog | Implemented |
| POST | `/api/v1/supplies/pending` | Operations Catalog | Implemented |
| GET | `/api/v1/stock/:projectId` | Inventory | Implemented |
| GET | `/api/v1/work-order-drafts/digital/groups` | Work Orders | Implemented |
| GET | `/api/v1/work-order-drafts/digital` | Work Orders | Implemented |
| POST | `/api/v1/work-order-drafts/digital/preview-number` | Work Orders | Implemented |
| POST | `/api/v1/work-order-drafts/digital/batch/preview-number` | Work Orders | Implemented |
| POST | `/api/v1/work-order-drafts/digital/batch` | Work Orders | Implemented |
| POST | `/api/v1/work-order-drafts/digital` | Work Orders | Implemented |
| GET | `/api/v1/work-order-drafts/:id/pdf-data` | Work Orders | Implemented |
| GET | `/api/v1/work-order-drafts/:id/group-pdf-data` | Work Orders | Implemented |
| GET | `/api/v1/work-order-drafts/:id` | Work Orders | Implemented |
| GET | `/api/v1/work-order-drafts/:id/group` | Work Orders | Implemented |
| PUT | `/api/v1/work-order-drafts/:id/group` | Work Orders | Implemented |
| PUT | `/api/v1/work-order-drafts/:id` | Work Orders | Implemented |
| POST | `/api/v1/work-order-drafts/:id/publish` | Work Orders | Stubbed from mobile UI perspective |

## API Ownership Rules

- Ownership follows business capability, not file location.
- `GET /api/v1/projects/:id/labors` and `POST /api/v1/projects/:id/labors`
  are owned by `Operations Catalog` even though they are mounted in the projects
  route file.
- Labor lookup depends on the external Manager/Core schema including
  `labors.is_pending` from migration `000232_labor_pending_changes`; the BFF
  keeps the route stable and does not substitute grouped work-order history.
- All `/api/v1/work-order-drafts/**` routes are owned by `Work Orders`.
- Health/version are owned by `Platform & Delivery`.

## Non-Canonical Client Paths

| Client path | Status | Reason |
|---|---|---|
| `/api/v1/work-orders/:id` | Stubbed | Client code exists, but no canonical BFF route exists |
| `/api/v1/projects/:id/fields` | Stubbed | Client code exists, but no canonical BFF route exists |

These paths must not be documented as implemented APIs unless matching BFF routes
are added and verified.
