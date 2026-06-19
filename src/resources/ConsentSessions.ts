import { Creatorlayer } from "../Creatorlayer.js";
import type {
  CreateConsentSessionParams,
  ConsentSessionCreated,
  ConsentSessionStatus,
} from "../types.js";

export class ConsentSessions {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Create a standalone consent session linked to an existing verification.
   *
   * Use this when you need a fresh consent URL — for example to resend an
   * expired link to the same creator. A verification can have multiple
   * consent sessions; only one may be pending at a time.
   *
   * An `Idempotency-Key` is generated automatically. To retry with the same
   * key, pass `idempotencyKey` explicitly.
   *
   * @example
   * const { consent_url } = await cl.consentSessions.create({
   *   verification_id: 'ver_abc123',
   *   lender_name: 'Acme Finance',
   *   creator_email: 'creator@example.com',
   *   return_url: 'https://app.yourlender.com/application/done',
   * });
   */
  create(
    params: CreateConsentSessionParams,
    idempotencyKey?: string,
  ): Promise<ConsentSessionCreated> {
    return this.client._request<ConsentSessionCreated>(
      "POST",
      "/api/v1/consent-sessions",
      {
        body: params,
        headers: {
          "Idempotency-Key": idempotencyKey ?? Creatorlayer.generateIdempotencyKey(),
        },
      },
    );
  }

  /**
   * Retrieve the current status of a consent session.
   *
   * Poll this to detect when a creator has completed or declined the flow,
   * or check `GET /api/v1/verifications/:id` which reflects the same state
   * at the verification level.
   *
   * @example
   * const session = await cl.consentSessions.get(sessionId);
   * if (session.status === 'completed') { ... }
   */
  get(sessionId: string): Promise<ConsentSessionStatus> {
    return this.client._request<ConsentSessionStatus>(
      "GET",
      `/api/v1/consent-sessions/${sessionId}`,
    );
  }
}
