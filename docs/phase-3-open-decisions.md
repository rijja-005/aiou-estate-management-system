# Phase 3 - Open Decisions

## Confirm Before Phase 4 Scaffold
- Exact folder naming convention for domain feature modules.
- Whether to adopt a queue provider immediately or start with a minimal idempotent scheduled-job abstraction.
- Whether to use Server Actions for only simple forms or also selected create/update workflows.
- Whether ADR files should be created now or in Phase 4 with the first scaffold.
- Whether report read models should be introduced in the initial scaffold or deferred until report implementation.

## Recommended Defaults
- Keep Server Actions narrow.
- Start with a minimal job abstraction that can later bind to a provider.
- Introduce ADRs before the first code scaffold so architectural decisions stay traceable.
- Prefer feature-based folder boundaries under `src/features`.
