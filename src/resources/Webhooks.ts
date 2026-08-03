import { createHmac, timingSafeEqual } from "crypto";
import type { Creatorlayer } from "../Creatorlayer.js";
import type {
  CreateWebhookParams,
  UpdateWebhookParams,
  Webhook,
  WebhookDeliveriesResponse,
  WebhookEventPayload,
  WebhookTestResponse,
} from "../types.js";
import { CreatorlayerWebhookSignatureError } from "../errors.js";

/** Maximum age (seconds) of a signed webhook request before it is rejected. */
const REPLAY_TOLERANCE_SECONDS = 300;

export class Webhooks {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Register a webhook endpoint to receive verification events.
   *
   * @example
   * const webhook = await cl.webhooks.create({
   *   url: "https://your-app.example.com/webhooks/creatorlayer",
   *   events: ["verification.completed", "verification.failed"],
   * });
   */
  create(params: CreateWebhookParams): Promise<Webhook> {
    return this.client._request<Webhook>("POST", "/api/v1/webhooks", {
      body: params,
    });
  }

  /**
   * List all registered webhook endpoints.
   */
  list(): Promise<Webhook[]> {
    return this.client._request<Webhook[]>("GET", "/api/v1/webhooks");
  }

  /**
   * Delete a webhook endpoint.
   */
  del(webhookId: string): Promise<void> {
    return this.client._request<void>(
      "DELETE",
      `/api/v1/webhooks/${webhookId}`
    );
  }

  /**
   * Update a webhook endpoint — change its URL, subscribed events, signing
   * secret, or active state. Pass only the fields you want to change.
   *
   * @example
   * await cl.webhooks.update(webhookId, {
   *   events: ["verification.completed", "tape.monitor.alert"],
   *   active: true,
   * });
   */
  update(webhookId: string, params: UpdateWebhookParams): Promise<Webhook> {
    return this.client._request<Webhook>(
      "PATCH",
      `/api/v1/webhooks/${webhookId}`,
      { body: params },
    );
  }

  /**
   * Fire a test delivery to a webhook endpoint to verify connectivity.
   *
   * Dispatches a synthetic `verification.completed` event with `test: true`
   * in the payload. The delivery will appear in the webhook's delivery log.
   *
   * @example
   * const result = await cl.webhooks.test(webhookId);
   * console.log(result.sent); // true
   */
  test(webhookId: string): Promise<WebhookTestResponse> {
    return this.client._request<WebhookTestResponse>(
      "POST",
      `/api/v1/webhooks/${webhookId}/test`,
    );
  }

  /**
   * Retrieve the delivery log for a webhook endpoint.
   *
   * Returns a list of recent delivery attempts, including HTTP status codes,
   * success/failure flags, and response times.
   *
   * @example
   * const { deliveries } = await cl.webhooks.getDeliveries(webhookId);
   * const failed = deliveries.filter(d => !d.success);
   */
  getDeliveries(webhookId: string): Promise<WebhookDeliveriesResponse> {
    return this.client._request<WebhookDeliveriesResponse>(
      "GET",
      `/api/v1/webhooks/${webhookId}/deliveries`
    );
  }

  // ---------------------------------------------------------------------------
  // Signature & replay-protection verification
  // ---------------------------------------------------------------------------

  /**
   * Verify the `X-Creatorlayer-Signature` and `X-Creatorlayer-Timestamp` headers
   * on an incoming webhook request, then parse and return the payload.
   *
   * Always call this before processing any webhook payload.
   * Throws `CreatorlayerWebhookSignatureError` if verification fails.
   *
   * Pass the `X-Creatorlayer-Timestamp` header value in `options.timestamp` to
   * enable replay-attack protection (requests older than 5 minutes are rejected).
   *
   * @example
   * // Express
   * app.post("/webhooks/creatorlayer", express.raw({ type: "application/json" }), (req, res) => {
   *   const event = cl.webhooks.verifyAndParse(
   *     req.body,
   *     req.headers["x-creatorlayer-signature"] as string,
   *     process.env.WEBHOOK_SECRET!,
   *     { timestamp: req.headers["x-creatorlayer-timestamp"] as string }
   *   );
   *   if (event.event === "verification.completed") {
   *     // fetch the tape
   *   }
   *   res.sendStatus(200);
   * });
   */
  verifyAndParse(
    rawBody: Buffer | string,
    signature: string,
    secret: string,
    options?: { timestamp?: string; toleranceSeconds?: number }
  ): WebhookEventPayload {
    // Replay protection — validate timestamp if provided
    if (options?.timestamp !== undefined) {
      const ts = Number(options.timestamp);
      if (!Number.isFinite(ts) || ts <= 0) {
        throw new CreatorlayerWebhookSignatureError();
      }
      const tolerance = options.toleranceSeconds ?? REPLAY_TOLERANCE_SECONDS;
      const ageSeconds = Math.floor(Date.now() / 1000) - ts;
      if (ageSeconds > tolerance || ageSeconds < -60) {
        throw new CreatorlayerWebhookSignatureError();
      }
    }

    const body =
      typeof rawBody === "string" ? Buffer.from(rawBody) : rawBody;

    const expected = createHmac("sha256", secret).update(body).digest("hex");

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expected);

    const valid =
      sigBuffer.length === expBuffer.length &&
      timingSafeEqual(sigBuffer, expBuffer);

    if (!valid) {
      throw new CreatorlayerWebhookSignatureError();
    }

    return JSON.parse(body.toString()) as WebhookEventPayload;
  }

  /**
   * Returns true if the signature (and optional timestamp) is valid, false otherwise.
   * Use `verifyAndParse` if you want to parse the payload at the same time.
   */
  verifySignature(
    rawBody: Buffer | string,
    signature: string,
    secret: string,
    options?: { timestamp?: string; toleranceSeconds?: number }
  ): boolean {
    try {
      this.verifyAndParse(rawBody, signature, secret, options);
      return true;
    } catch {
      return false;
    }
  }
}
