# creatorlayer

Official Node.js / TypeScript SDK for the [Creatorlayer API](https://docs.creatorlayer.eu).

Requires **Node.js 18+**.

## Installation

```bash
npm install creatorlayer
```

## Quick start

```typescript
import { Creatorlayer } from "creatorlayer";

const cl = new Creatorlayer({
  apiKey: process.env.CREATORLAYER_API_KEY!,
  sandbox: true, // omit for production
});

// 1. Create a verification
const { verification_id, consent_url } = await cl.verifications.create({
  obligor_reference: "creator-abc-123",
  creator_platforms: ["youtube", "stripe"],
  lender_name: "Acme Finance",
});

// Send consent_url to the creator so they can connect their platforms

// 2. Poll for completion
let status = "pending_consent";
while (status !== "completed" && status !== "failed" && status !== "expired") {
  await new Promise((r) => setTimeout(r, 5000));
  ({ status } = await cl.verifications.retrieve(verification_id));
}

// 3. Retrieve the Risk Tape
if (status === "completed") {
  const tape = await cl.verifications.retrieveTape(verification_id);
  console.log(tape.eligibility[0].risk_tier); // "prime" | "standard" | ...
  console.log(tape.cashflow_summary.avg_monthly_revenue_12m);
}
```

## Webhooks (recommended over polling)

```typescript
import express from "express";
import { Creatorlayer } from "creatorlayer";

const cl = new Creatorlayer({ apiKey: process.env.CREATORLAYER_API_KEY! });
const app = express();

// IMPORTANT: use raw body parser for signature verification
app.post(
  "/webhooks/creatorlayer",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const event = cl.webhooks.verifyAndParse(
      req.body,
      req.headers["x-creatorlayer-signature"] as string,
      process.env.WEBHOOK_SECRET!
    );

    if (event.event === "verification.completed") {
      const tape = await cl.verifications.retrieveTape(event.verification_id);
      // process tape...
    }

    res.sendStatus(200);
  }
);
```

## Error handling

```typescript
import {
  Creatorlayer,
  CreatorlayerRateLimitError,
  CreatorlayerValidationError,
  CreatorlayerNotFoundError,
} from "creatorlayer";

try {
  const tape = await cl.verifications.retrieveTape(id);
} catch (err) {
  if (err instanceof CreatorlayerNotFoundError) {
    // verification not completed yet, or wrong ID
  } else if (err instanceof CreatorlayerRateLimitError) {
    console.log(`retry after ${err.retryAfter}s`);
  } else if (err instanceof CreatorlayerValidationError) {
    console.log(err.message); // human-readable validation message
  }
}
```

The SDK automatically retries `429` (honouring `Retry-After`) and `503` responses with exponential backoff. Default: 2 retries. Override with `maxRetries`.

## API reference

### `new Creatorlayer(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | required | Your Bearer API key |
| `sandbox` | `boolean` | `false` | Use sandbox environment |
| `baseUrl` | `string` | — | Override base URL (takes precedence over `sandbox`) |
| `maxRetries` | `number` | `2` | Max retries on 429/503 |
| `timeout` | `number` | `30000` | Request timeout (ms) |

### `cl.verifications`

| Method | Description |
|---|---|
| `.create(params, idempotencyKey?)` | Create a verification. Idempotency key auto-generated if omitted. |
| `.retrieve(verificationId)` | Get verification status. |
| `.retrieveTape(verificationId)` | Get the full Risk Tape. Status must be `completed`. |

### `cl.benchmarks`

| Method | Description |
|---|---|
| `.retrieve(verificationId)` | Get percentile benchmarks. Status must be `completed`. |

### `cl.webhooks`

| Method | Description |
|---|---|
| `.create(params)` | Register a webhook endpoint. |
| `.list()` | List registered endpoints. |
| `.del(webhookId)` | Delete a webhook endpoint. |
| `.verifyAndParse(body, signature, secret)` | Verify signature and return parsed payload. Throws on failure. |
| `.verifySignature(body, signature, secret)` | Verify signature. Returns boolean. |

### `cl.gdpr` (requires `gdpr_admin` key)

| Method | Description |
|---|---|
| `.access({ email?, obligor_id? })` | Retrieve all data for a creator. |
| `.erase({ email?, obligor_id? })` | Permanently erase creator data. |
| `.export({ email?, obligor_id? })` | Export creator data. |

## Sandbox testing

Use `obligor_reference` values starting with `test-` to trigger synthetic flows without a real creator:

| Reference prefix | Result |
|---|---|
| `test-complete-*` | `verification.completed` event within ~5 seconds |
| `test-fail-*` | `verification.failed` event (reason: `platform_error`) |
| `test-expire-*` | `verification.expired` event |

## Links

- [Documentation](https://docs.creatorlayer.eu)
- [API Reference](https://docs.creatorlayer.eu/api-reference)
- [Getting Started](https://docs.creatorlayer.eu/getting-started)
- [hello@creatorlayer.eu](mailto:hello@creatorlayer.eu)
