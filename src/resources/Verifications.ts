import { Creatorlayer } from "../Creatorlayer.js";
import type {
  CreateVerificationParams,
  VerificationCreated,
  VerificationStatus_,
  TapeResponse,
  EligibilityCheck,
  MonitoredVerificationsResponse,
  EnrollMonitoringParams,
  EnrollMonitoringResponse,
  UnenrollMonitoringResponse,
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
   *   lender_name: "Acme Finance",
   *   webhook_url: "https://your-server.example.com/webhooks/creatorlayer",
   *   custom_reference: "LOAN-2026-0001",
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
   * Returns `{ tape, signed_jwt }`. The `signed_jwt` is a compact ES256 JWT
   * that lenders can cache and verify offline — see `cl.riskTapes.verify()`.
   *
   * @example
   * const { tape, signed_jwt } = await cl.verifications.retrieveTape(verificationId);
   * console.log(tape.eligibility[0].risk_tier);
   */
  retrieveTape(verificationId: string): Promise<TapeResponse> {
    return this.client._request<TapeResponse>(
      "GET",
      `/api/v1/verifications/${verificationId}/tape`
    );
  }

  /**
   * Check eligibility without retrieving the full tape. Free endpoint — does not
   * decrypt or transmit tape content. Use this to screen before calling retrieveTape.
   *
   * Returns `eligible` (boolean | null) and `risk_tier` once the tape is computed.
   * Returns `eligible: null` and `risk_tier: null` while creator consent is pending.
   *
   * @example
   * const { eligible, risk_tier } = await cl.verifications.retrieveEligibility(verificationId);
   * if (eligible) { ... }
   */
  retrieveEligibility(verificationId: string): Promise<EligibilityCheck> {
    return this.client._request<EligibilityCheck>(
      "GET",
      `/api/v1/verifications/${verificationId}/eligibility`
    );
  }

  /**
   * Download a signed PDF report for a completed verification.
   *
   * Returns a Buffer containing the PDF bytes. Call `GET /tape` at least
   * once before this endpoint — the PDF is generated from the stored tape.
   *
   * The PDF embeds the signed JWT and a public verification URL
   * (`creatorlayer.eu/verify?token=…`) so recipients without API access can
   * independently confirm the document's authenticity.
   *
   * @example
   * const pdf = await cl.verifications.downloadTapePdf(verificationId);
   * fs.writeFileSync(`tape-${verificationId}.pdf`, pdf);
   */
  async downloadTapePdf(verificationId: string): Promise<Buffer> {
    const response = await this.client._requestRaw(
      "GET",
      `/api/v1/verifications/${verificationId}/tape/pdf`,
    );
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * List all verifications currently enrolled in portfolio monitoring.
   *
   * Each row includes `monthly_rate_cents` (billing amount), `baseline_avg_revenue`
   * (income baseline captured at enrollment), and `last_alert_at`.
   *
   * @example
   * const { monitored } = await cl.verifications.listMonitored();
   */
  listMonitored(): Promise<MonitoredVerificationsResponse> {
    return this.client._request<MonitoredVerificationsResponse>(
      "GET",
      "/api/v1/verifications/monitored"
    );
  }

  /**
   * Enroll a completed verification in portfolio monitoring.
   *
   * Creatorlayer re-checks the creator's income daily using existing OAuth tokens.
   * If income drops more than `alert_threshold_pct` (default 20%) below the baseline
   * captured at enrollment, an alert email is sent to the lender.
   *
   * Billed at `monthly_rate_cents` per month while enrolled (default €5.00/month).
   *
   * @example
   * const result = await cl.verifications.enroll(verificationId, { alert_threshold_pct: 20 });
   * console.log(result.monthly_rate_cents); // 500 = €5.00/month
   */
  enroll(
    verificationId: string,
    params?: EnrollMonitoringParams
  ): Promise<EnrollMonitoringResponse> {
    return this.client._request<EnrollMonitoringResponse>(
      "POST",
      `/api/v1/verifications/${verificationId}/monitor`,
      { body: params ?? {} }
    );
  }

  /**
   * Unenroll a verification from portfolio monitoring.
   *
   * Stops daily income re-checks and terminates the recurring billing item.
   *
   * @example
   * await cl.verifications.unenroll(verificationId);
   */
  unenroll(verificationId: string): Promise<UnenrollMonitoringResponse> {
    return this.client._request<UnenrollMonitoringResponse>(
      "DELETE",
      `/api/v1/verifications/${verificationId}/monitor`
    );
  }
}
