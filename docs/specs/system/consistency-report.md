# Consistency Report Normalizado

| Campo | Valor |
|---|---|
| Fecha | 2026-06-05 |
| Resultado | Coherent baseline with external UNKNOWNs |
| Scope | Existing discovered information only |
| Governance | `docs/specs/system/sdd-governance.md` |

## Consistency Report

| Check | Result | Notes |
|---|---|---|
| Every domain exists in Feature Inventory | PASS | Only the seven canonical domains are used |
| Every feature belongs to exactly one domain | PASS | See `features/feature-inventory.md` |
| Every API documented exists in code | PASS with explicit exclusions | Canonical APIs map to BFF routes; stale client-only paths are marked Stubbed/non-canonical |
| Every entity belongs to exactly one domain | PASS | See `data/data-ownership.md` |
| Every entity exists in migrations/repositories | PASS with UNKNOWN classification | No local DB exists; external persistence is classified as UNKNOWN |
| No planned feature is documented as implemented | PASS | Authenticated release smoke remains Planned |
| No implemented feature is missing from feature inventory | PASS against discovered scope | Inventory is normalized from prior audit evidence |
| Domain ownership is consistent across specs | PASS | Domains, features, APIs and data use same owners |
| No contradictions exist between specs | PASS after normalization | Historical stale statuses were replaced |
| All UNKNOWN markers are justified | PASS | UNKNOWNs include explicit justification |
| Duplicate specs / overlapping ownership | PASS with legacy folders normalized | Legacy specs now point to canonical ownership |
| Baseline governance exists | PASS | Future SDD work must pass `system/sdd-governance.md` gates |

## Missing Coverage Report

No missing feature coverage remains within the discovered scope.

Known non-implemented/non-verifiable items are intentionally classified:

| Item | Classification |
|---|---|
| Single draft creation primary routed flow | Partially Implemented |
| Mobile publish action | Stubbed |
| `/api/v1/work-orders/:id` client path | Stubbed / non-canonical |
| `/api/v1/projects/:id/fields` client path | Stubbed / non-canonical |
| Drawer/new supply button behavior | Stubbed |
| Authenticated release smoke | Planned |
| Live GCP/GitHub/Firebase/Secret Manager state | UNKNOWN |
| External database schema and persistence rules | UNKNOWN |

## Contradiction Report

Resolved contradictions:

| Prior contradiction | Resolution |
|---|---|
| `feedback-guardar-ot` had a stale non-implemented status | Reclassified as Implemented under `Work Orders` |
| `crear-insumos-labores` had a stale pending status for labors | Reclassified as Implemented under `Operations Catalog` |
| Platform spec mixed repo config with live-state claims | Split into Implemented repo config and UNKNOWN live state |
| Non-existent/stale client API paths risked being treated as implemented APIs | Marked Stubbed/non-canonical |
| External DB/schema claims were stated as facts | Reclassified as UNKNOWN unless repo-verifiable |

Remaining contradictions:

| Item | Result |
|---|---|
| Cross-spec ownership contradictions | None found after normalization |
| Implemented vs planned status contradictions | None found after normalization |
| API ownership contradictions | None found after normalization |
| Entity ownership contradictions | None found after normalization |

## SDD Readiness Report

Status: READY FOR SDD BASELINE USE, with external UNKNOWNs explicitly bounded.

The baseline is coherent for spec-driven development because:

- Domain taxonomy is canonical.
- Feature ownership is single-domain.
- API ownership is aligned to domain capability.
- Entity ownership is single-domain.
- Runbook procedure content is separated from specs.
- Planned, stubbed, partial and UNKNOWN statuses are not mixed with implemented
  features.
- Governance gates now define how future SDD specs enter the baseline.

Remaining blockers are outside this repo:

- Live GCP/Firebase/GitHub/Secret Manager state requires provider audit.
- External Manager API/database schema requires backend/database audit.
- Tenant isolation guarantees require backend/identity/platform evidence.
