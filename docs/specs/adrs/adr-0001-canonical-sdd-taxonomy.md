# ADR-0001: Canonical SDD Taxonomy And Ownership

| Campo | Valor |
|---|---|
| Status | Accepted |
| Date | 2026-06-05 |

## Context

The previous `docs/specs` tree mixed feature specs, runbook details, historical
implementation plans and unverifiable external claims. This made it impossible
to audit whether each feature, API and entity had one authoritative owner.

## Decision

Use exactly seven canonical domains:

- Identity & Access
- Work Orders
- Project Context
- Operations Catalog
- Inventory
- Platform & Delivery
- Frontend Shell

Every feature, API and entity must map to exactly one canonical owner. External
state that cannot be verified from this repository must be marked UNKNOWN.

`docs/specs` is the authoritative SDD baseline. Future SDD work must first
validate the requested feature/API/entity against the baseline inventories. If
the requested work is not represented there, the baseline must be updated before
the feature spec proceeds.

## Consequences

- Existing specs are normalized instead of treated as independent sources of
  truth.
- Runbook procedures are separated from stable specs.
- PDF ownership is assigned to `Work Orders`.
- Browser session storage ownership is assigned to `Frontend Shell`.
- Authentication behavior remains owned by `Identity & Access`.
- Live GCP/GitHub/Firebase/Secret Manager state remains UNKNOWN until audited
  outside this repo.
- New domains, features, APIs, entities or ownership changes require an explicit
  baseline update before downstream SDD specs are created.
