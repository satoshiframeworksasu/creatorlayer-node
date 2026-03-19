import { Creatorlayer } from "../Creatorlayer.js";
import type {
  CreateVerificationParams,
  VerificationCreated,
  VerificationStatus_,
  RiskTape,
} from "../types.js";

export class Verifications {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Initiate a creator income verification.
   *
   * An `Idempotency-Key` is generated automatically. To retry with the same
   * key, pass `idempotencyKey` explicitly.
   *
   * @example
   * const { verification_id, consent_url } = await cl.verifications.create({
   *   obligor_reference: "creator-abc-123",
   *   creator_platforms: ["youtube", "stripe"],
   *   lender_name: "Acme Finance",
   * });
   */
  create(
    params: CreateVerificationParams,
    idempotencyKey?: string
  ): Promise<VerificationCreated> {
    return this.client._request<VerificationCreated>(
      "POST",
      "/api/v1/verifications",
      {
        body: params,
        headers: {
          "Idempotency-Key": idempotencyKey ?? Creatorlayer.generateIdempotencyKey(),
        },
      }
    );
  }

  /**
   * Poll verification status.
   *
   * @example
   * const { status } = await cl.verifications.retrieve(verificationId);
   */
  retrieve(verificationId: string): Promise<VerificationStatus_> {
    return this.client._request<VerificationStatus_>(
      "GET",
      `/api/v1/verifications/${verificationId}`
    );
  }

  /**
   * Retrieve the full Risk Tape once status is `completed`.
   *
   * @example
   * const tape = await cl.verifications.retrieveTape(verificationId);
   * console.log(tape.eligibility[0].risk_tier);
   */
  retrieveTape(verificationId: string): Promise<RiskTape> {
    return this.client._request<RiskTape>(
      "GET",
      `/api/v1/verifications/${verificationId}/tape`
    );
  }
}
