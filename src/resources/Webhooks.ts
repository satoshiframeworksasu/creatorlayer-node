import { createHmac, timingSafeEqual } from "crypto";
import type { Creatorlayer } from "../Creatorlayer.js";
import type {
  CreateWebhookParams,
  Webhook,
  WebhookEventPayload,
} from "../types.js";
import { CreatorlayerWebhookSignatureError } from "../errors.js";

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

  // ---------------------------------------------------------------------------
  // Signature verification
  // ---------------------------------------------------------------------------

  /**
   * Verify the `X-Creatorlayer-Signature` header on an incoming webhook request.
   *
   * Always call this before processing any webhook payload.
   * Throws `CreatorlayerWebhookSignatureError` if verification fails.
   *
   * @example
   * // Express
   * app.post("/webhooks/creatorlayer", express.raw({ type: "application/json" }), (req, res) => {
   *   const event = cl.webhooks.verifyAndParse(
   *     req.body,
   *     req.headers["x-creatorlayer-signature"] as string,
   *     process.env.WEBHOOK_SECRET!
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
    secret: string
  ): WebhookEventPayload {
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
   * Returns true if the signature is valid, false otherwise.
   * Use `verifyAndParse` if you want to parse the payload at the same time.
   */
  verifySignature(
    rawBody: Buffer | string,
    signature: string,
    secret: string
  ): boolean {
    try {
      this.verifyAndParse(rawBody, signature, secret);
      return true;
    } catch {
      return false;
    }
  }
}
