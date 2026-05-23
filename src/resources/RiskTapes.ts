import { Creatorlayer } from "../Creatorlayer.js";
import type { TapeVerifyResult, JwksResponse } from "../types.js";

export class RiskTapes {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Verify a signed tape JWT: checks signature, expiry, and revocation status.
   *
   * Pass the `signed_jwt` value returned by `GET /verifications/:id/tape`.
   * This endpoint is public — no API key is required.
   *
   * Use this when:
   *   - Validating a tape received from a third party
   *   - Checking that a cached tape has not been revoked (e.g. GDPR withdrawal)
   *   - Confirming expiry before acting on a stored tape
   *
   * For purely offline verification (no network call), fetch the public key once
   * from `getJwks()` and verify the JWT signature locally with any ES256 library.
   * You still need this endpoint to check revocation.
   *
   * @example
   * const result = await cl.riskTapes.verify(signed_jwt);
   * if (!result.valid) {
   *   console.log(result.revoked ? "Tape revoked" : result.error);
   * }
   */
  verify(token: string): Promise<TapeVerifyResult> {
    return this.client._request<TapeVerifyResult>(
      "POST",
      "/api/v1/risk-tapes/verify",
      { body: { token } }
    );
  }

  /**
   * Fetch Creatorlayer's public key set in JWKS format (RFC 7517).
   *
   * Use this to verify `signed_jwt` fields offline without making a request to
   * the main API on every tape read. Pin the key at startup and refresh if
   * verification fails with an unexpected key ID.
   *
   * This endpoint is public — no API key is required.
   *
   * @example
   * const { keys } = await cl.riskTapes.getJwks();
   * // Pass keys[0] to your preferred ES256 JWT verification library.
   */
  getJwks(): Promise<JwksResponse> {
    return this.client._request<JwksResponse>(
      "GET",
      "/.well-known/jwks.json"
    );
  }
}
