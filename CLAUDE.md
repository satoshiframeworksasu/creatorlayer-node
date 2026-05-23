# Creatorlayer Node SDK — Claude Code Guide

## What this package is

Official Node.js / TypeScript SDK for the Creatorlayer API. Published as `creatorlayer`
on npm. Wraps the REST API at `api.creatorlayer.eu` with typed resources and error
classes.

Operates as a thin, zero-dependency HTTP client — not a full ORM or framework. The
design goal is to mirror the Stripe Node SDK pattern: a root `Creatorlayer` client
with namespaced resource classes.

---

## Tech stack

- TypeScript, compiled to ESM (`dist/`)
- Node.js ≥ 18 (uses native `fetch`)
- No runtime dependencies — intentional

---

## Resource structure

```
src/
├── Creatorlayer.ts        # Root client class
├── types.ts               # Shared type definitions
├── errors.ts              # Typed error classes
└── resources/
    ├── Verifications.ts   # Verification CRUD + status
    ├── Benchmarks.ts      # Metric distribution benchmarks
    ├── Webhooks.ts        # Webhook endpoint management
    ├── GDPR.ts            # Consent withdrawal, data export
    ├── Dashboard.ts       # Lender dashboard summary stats
    ├── Usage.ts           # API usage / quota
    ├── EconomyIndex.ts    # Creator economy index data
    ├── Intelligence.ts    # AI-assisted risk signals
    └── Securitization.ts  # Portfolio / securitisation endpoints
```

---

## Architecture rules — never break these

### Mirror the API — no SDK-side business logic
The SDK is a typed wrapper. It must not add validation logic, retry strategies, or
caching that the API doesn't expose. If the API returns a field, expose it in the type.
If the API requires a field, require it in the method signature. No more, no less.

### Every new API endpoint needs a corresponding SDK method
When `creatorlayer-api` adds or changes an endpoint, update the matching resource file
here. The SDK and API must stay in sync — version them together.

### Types come from the API response shape
Do not invent type names. Use the same naming as the API JSON response keys, converted
to camelCase only where TypeScript convention requires it. Export all types from
`src/types.ts`.

### Errors map 1:1 to API error codes
`src/errors.ts` contains typed error classes for each HTTP status the API returns.
When the API adds a new error code or status, add the corresponding error class.

### No CommonJS
This package is pure ESM (`"type": "module"` in package.json). Do not add `require()`
calls, `module.exports`, or `.cjs` output targets.

### Build before testing
The SDK compiles TypeScript to `dist/` via `tsc`. Tests run against the compiled output,
not the source. Always run `npm run build` before `npm test`.

---

## Adding a new resource or endpoint

1. Add the method to the relevant file in `src/resources/`
2. Add request/response types to `src/types.ts`
3. Export the resource class from `src/index.ts` if it's new
4. Run `npm run build && npm test` to verify
5. Update the API Explorer (`creatorlayer-api-explorer`) — add the endpoint to
   `src/lib/endpoints.ts` there

---

## Relationship to other repos

| Repo | Relationship |
|---|---|
| `creatorlayer-api` | The API this SDK wraps. Keep endpoint signatures in sync. |
| `creatorlayer-api-explorer` | The interactive sandbox — also lists endpoints centrally in `src/lib/endpoints.ts` |
| `creatorlayer-docs` | API reference is generated from `static/openapi/openapi.yaml` — when adding endpoints, also update the OpenAPI spec |

---

## Building and running

```bash
npm run build      # compile TypeScript → dist/
npm run dev        # watch mode
npm run typecheck  # type-check without emitting
```
