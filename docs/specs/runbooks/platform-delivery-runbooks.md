# Platform & Delivery Runbook Baseline

## Purpose

This file separates operational procedures from domain/API/data specs.

Specs define stable contracts and ownership. Runbooks define how operators carry
out environment procedures.

## Canonical Runbooks

| Runbook | Domain owner | Status | Procedure source |
|---|---|---|---|
| Deploy dev | Platform & Delivery | Implemented as workflow config | `.github/workflows/` |
| Deploy staging | Platform & Delivery | Implemented as workflow config | `.github/workflows/` |
| Approve staging | Platform & Delivery | Implemented as workflow config | `.github/workflows/` |
| Promote to prod | Platform & Delivery | Implemented as workflow config | `.github/workflows/` |
| Rollback staging | Platform & Delivery | Implemented as workflow config | `.github/workflows/` |
| Rollback prod | Platform & Delivery | Implemented as workflow config | `.github/workflows/` |
| Provision mobile environment | Platform & Delivery | Implemented as script config | `scripts/gcp/provision-mobile-env.sh` |
| Configure GitHub env vars | Platform & Delivery | Implemented as script config | `scripts/gh/configure-github.sh` |
| Basic release smoke | Platform & Delivery | Implemented as script config | `scripts/smoke_release.sh` |
| Authenticated release smoke | Platform & Delivery | Planned | No implemented authenticated smoke flow verified |

## Runbook Boundaries

Runbooks may describe:

- Commands to deploy, promote, rollback, provision and smoke.
- Required operator permissions.
- Environment-specific execution order.

Runbooks must not define:

- Domain ownership.
- Feature status.
- API contracts.
- Entity ownership.
- External live-state facts unless independently verified.

## UNKNOWN justificados

| UNKNOWN | Justification |
|---|---|
| Whether a runbook has succeeded in live GCP/Firebase/GitHub | Requires live provider audit |
| Whether required reviewers are configured | Requires GitHub environment audit |
| Whether secrets exist and have current values | Requires Secret Manager audit |
