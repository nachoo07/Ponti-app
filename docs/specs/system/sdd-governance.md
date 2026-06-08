# SDD Baseline Governance

| Campo | Valor |
|---|---|
| Sistema | Ponti Mobile |
| Estado | Active |
| Fecha | 2026-06-05 |
| Autoridad | `docs/specs` |

## Purpose

This governance file defines how the normalized SDD baseline must be used before
any future spec-driven development work starts.

The baseline is authoritative. It is not a discovery scratchpad.

## Authoritative Sources

| Concern | Source of truth |
|---|---|
| Canonical domains | `docs/specs/system/sdd-baseline.md`, `docs/specs/domains/domain-architecture.md` |
| Feature ownership and status | `docs/specs/features/feature-inventory.md` |
| API ownership and status | `docs/specs/apis/api-inventory.md` |
| Entity ownership and storage classification | `docs/specs/data/data-ownership.md` |
| Operational procedures | `docs/specs/runbooks/` |
| Taxonomy decision | `docs/specs/adrs/adr-0001-canonical-sdd-taxonomy.md` |

## Frozen Canonical Taxonomy

Only these domains are valid:

- `Identity & Access`
- `Work Orders`
- `Project Context`
- `Operations Catalog`
- `Inventory`
- `Platform & Delivery`
- `Frontend Shell`

No feature, API, entity, integration or runbook may introduce another domain
without an explicit baseline update.

## Baseline Entry Gates

Before starting a future feature spec:

1. The feature must exist in `features/feature-inventory.md`.
2. The feature must have exactly one owner domain.
3. Any API used by the feature must exist in `apis/api-inventory.md` or be
   marked `Stubbed` / `non-canonical`.
4. Any entity used by the feature must exist in `data/data-ownership.md` with
   exactly one owner domain and a storage classification.
5. Any operational procedure must be kept in `runbooks/`, not mixed into
   feature/domain/API/data specs.

If any gate fails, the baseline must be updated first. Do not create downstream
feature specs that bypass these sources.

## Status Gates

Status changes require evidence:

| Transition | Required evidence |
|---|---|
| Planned -> Implemented | Versioned code, config, workflow or script evidence |
| Stubbed -> Implemented | Active routed/user flow or active runtime route evidence |
| Partially Implemented -> Implemented | Complete primary flow evidence |
| UNKNOWN -> Implemented | Audited evidence from the owning source |
| Implemented -> Planned/Stubbed/UNKNOWN | Explicit deprecation, removal or audit evidence |

No `Planned` feature may be documented as `Implemented`.

No `Implemented` feature may be documented as `Planned`, `Stubbed` or `UNKNOWN`
unless the baseline records the evidence for that status change.

## UNKNOWN Policy

Keep these as `UNKNOWN` until separately audited:

- Live GCP state
- Live Firebase state
- Live GitHub environment/reviewer state
- Secret Manager values and permissions
- External Manager API internals
- External database schema and persistence rules
- Tenant isolation guarantees

Repository-local assumptions are not enough to clear these UNKNOWNs.

## Spec / Runbook Separation

Specs describe stable ownership and contracts:

- Domains
- Features
- APIs
- Data/entities
- ADRs

Runbooks describe procedures:

- Deploy
- Promote
- Rollback
- Provision
- Smoke

Operational steps must not redefine domain ownership, feature status, API
contracts or entity ownership.
