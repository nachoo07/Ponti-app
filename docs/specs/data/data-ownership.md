# Data Ownership Baseline

## Database Position

Ponti Mobile does not own a local database in this repository. There are no
repo-local migrations, ORM models, SQL schema files, or repositories of record.

Business persistence is external through the Manager API. External database
details remain UNKNOWN unless audited from the owning backend/database repo.

## Canonical Entity Ownership

| Entity | Owner domain | Storage classification |
|---|---|---|
| Identity user | Identity & Access | Google Identity Platform external |
| Access token | Identity & Access | Google Identity Platform external / browser-local copy |
| Refresh token | Identity & Access | Google Identity Platform external / browser-local copy |
| Browser session state | Frontend Shell | Browser-local |
| Route | Frontend Shell | Local frontend code |
| Navigation item | Frontend Shell | Local frontend code |
| Customer | Project Context | External Manager API / UNKNOWN database |
| Campaign | Project Context | External Manager API / UNKNOWN database |
| Project | Project Context | External Manager API / UNKNOWN database |
| Project detail | Project Context | External Manager API / UNKNOWN database |
| Field | Project Context | External Manager API / UNKNOWN database |
| Lot | Project Context | External Manager API / UNKNOWN database |
| Crop | Project Context | External Manager API / UNKNOWN database |
| Labor | Operations Catalog | External Manager API / UNKNOWN database |
| Labor category | Operations Catalog | External Manager API / UNKNOWN database |
| Contractor | Operations Catalog | External Manager API / UNKNOWN database |
| Supply | Operations Catalog | External Manager API / UNKNOWN database |
| Pending supply | Operations Catalog | External Manager API / UNKNOWN database |
| Stock item | Inventory | External Manager API / UNKNOWN database |
| Stock snapshot | Inventory | External Manager API / UNKNOWN database |
| Stock annotation | Inventory | External Manager API / UNKNOWN database |
| Work order draft | Work Orders | External Manager API / UNKNOWN database |
| Work order draft group | Work Orders | External Manager API / UNKNOWN database |
| Digital order number | Work Orders | External Manager API / UNKNOWN database |
| Investor contribution | Work Orders | Client-computed + External Manager API / UNKNOWN database |
| PDF data | Work Orders | External Manager API response + client rendering |
| Deployment release | Platform & Delivery | GitHub Deployments external / UNKNOWN live state |
| Artifact image | Platform & Delivery | Artifact Registry external / UNKNOWN live state |
| Firebase site | Platform & Delivery | Firebase external / UNKNOWN live state |
| Cloud Run service | Platform & Delivery | Cloud Run external / UNKNOWN live state |
| Secret reference | Platform & Delivery | Secret Manager external / UNKNOWN live state |

## Entity Ownership Rules

- Every entity above has exactly one owner domain.
- External Manager API entities are not local database entities.
- Browser-local session state is owned by `Frontend Shell`, even when auth
  behavior is owned by `Identity & Access`.
- PDF data is owned by `Work Orders`, not Platform.
- Deployment/infrastructure entities are owned by `Platform & Delivery`.

## UNKNOWN justificados

| UNKNOWN | Justification |
|---|---|
| External database schema | No migrations or DB repositories are present in this repo |
| External persistence rules | Manager API implementation is outside this repo |
| Tenant isolation at database level | Not represented in this repo |
| Live infrastructure state | Requires provider audit outside the repo |
