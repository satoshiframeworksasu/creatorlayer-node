import type { Creatorlayer } from "../Creatorlayer.js";
import type {
  LenderProfileResponse,
  PatchLenderProfileParams,
  IpAllowlistResponse,
  AddIpAllowlistParams,
  IpAllowlistEntry,
  RotateApiKeyResponse,
  DpaResponse,
  DpaAcceptParams,
  DpaAcceptResponse,
  PilotTermsResponse,
  PilotTermsAcceptParams,
  PilotTermsAcceptResponse,
  PortfolioSummaryResponse,
} from "../types.js";

export class LenderProfile {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Retrieve the authenticated lender's profile.
   *
   * Returns account details including company name, contact email, webhook URL,
   * plan tier, and timestamps.
   *
   * @example
   * const profile = await cl.lenderProfile.get();
   * console.log(profile.company_name, profile.plan_tier);
   */
  get(): Promise<LenderProfileResponse> {
    return this.client._request<LenderProfileResponse>(
      "GET",
      "/api/v1/lender/profile"
    );
  }

  /**
   * Update the authenticated lender's profile.
   *
   * Pass only the fields you want to update — unspecified fields are left
   * unchanged. Accepts `company_name`, `contact_email`, and `webhook_url`.
   *
   * @example
   * const profile = await cl.lenderProfile.update({
   *   webhook_url: "https://your-server.example.com/webhooks/creatorlayer",
   * });
   */
  update(params: PatchLenderProfileParams): Promise<LenderProfileResponse> {
    return this.client._request<LenderProfileResponse>(
      "PATCH",
      "/api/v1/lender/profile",
      { body: params }
    );
  }

  /**
   * Retrieve the IP allowlist for the authenticated lender.
   *
   * When the allowlist is non-empty, API requests from unlisted IPs are
   * rejected with 403. An empty list means no IP restriction is applied.
   *
   * @example
   * const { entries } = await cl.lenderProfile.getIpAllowlist();
   * entries.forEach(e => console.log(e.cidr, e.label));
   */
  getIpAllowlist(): Promise<IpAllowlistResponse> {
    return this.client._request<IpAllowlistResponse>(
      "GET",
      "/api/v1/lender/ip-allowlist"
    );
  }

  /**
   * Add a CIDR range to the IP allowlist.
   *
   * The CIDR must be a valid IPv4 or IPv6 CIDR block, e.g. `"203.0.113.42/32"`.
   * Once added, requests from outside all allowlisted CIDRs are blocked.
   *
   * @example
   * const entry = await cl.lenderProfile.addIpAllowlist({
   *   cidr: "203.0.113.42/32",
   *   label: "Office egress",
   * });
   * console.log(entry.id);
   */
  addIpAllowlist(params: AddIpAllowlistParams): Promise<IpAllowlistEntry> {
    return this.client._request<IpAllowlistEntry>(
      "POST",
      "/api/v1/lender/ip-allowlist",
      { body: params }
    );
  }

  /**
   * Remove a CIDR entry from the IP allowlist by its ID.
   *
   * If removing this entry would leave the allowlist empty, all IPs are
   * permitted again.
   *
   * @example
   * await cl.lenderProfile.deleteIpAllowlist(entryId);
   */
  deleteIpAllowlist(id: string): Promise<void> {
    return this.client._request<void>(
      "DELETE",
      `/api/v1/lender/ip-allowlist/${id}`
    );
  }

  /**
   * Rotate the authenticated lender's API key.
   *
   * The new API key is returned in the response. The old key is invalidated
   * immediately — update your configuration before calling this method.
   *
   * @example
   * const { api_key } = await cl.lenderProfile.rotateApiKey();
   * // Store api_key securely — it will not be shown again
   */
  rotateApiKey(): Promise<RotateApiKeyResponse> {
    return this.client._request<RotateApiKeyResponse>(
      "POST",
      "/api/v1/lender/api-keys/rotate"
    );
  }

  /**
   * Retrieve the current Data Processing Agreement (DPA) status.
   *
   * Returns the current DPA version, the version the lender has accepted,
   * when it was accepted, and whether a new acceptance is required.
   *
   * @example
   * const dpa = await cl.lenderProfile.getDpa();
   * if (dpa.acceptance_required) {
   *   await cl.lenderProfile.acceptDpa({ version: dpa.current_version });
   * }
   */
  getDpa(): Promise<DpaResponse> {
    return this.client._request<DpaResponse>(
      "GET",
      "/api/v1/lender/dpa"
    );
  }

  /**
   * Record acceptance of the Data Processing Agreement.
   *
   * Must be called with the `version` string returned by `getDpa()`. Recording
   * acceptance is required before the Creatorlayer pilot can begin and before
   * any creator data is shared with the lender.
   *
   * @example
   * await cl.lenderProfile.acceptDpa({ version: "1.0" });
   */
  acceptDpa(params: DpaAcceptParams): Promise<DpaAcceptResponse> {
    return this.client._request<DpaAcceptResponse>(
      "POST",
      "/api/v1/lender/dpa/accept",
      { body: params }
    );
  }

  /**
   * Retrieve the current Pilot Program Terms status.
   *
   * Returns the current Pilot Terms version, the version the lender has
   * accepted, when it was accepted, and whether acceptance is required.
   *
   * @example
   * const terms = await cl.lenderProfile.getPilotTerms();
   * if (terms.acceptance_required) {
   *   await cl.lenderProfile.acceptPilotTerms({ version: terms.current_version });
   * }
   */
  getPilotTerms(): Promise<PilotTermsResponse> {
    return this.client._request<PilotTermsResponse>(
      "GET",
      "/api/v1/lender/pilot-terms"
    );
  }

  /**
   * Record acceptance of the Pilot Program Terms.
   *
   * Must be called with the `version` string returned by `getPilotTerms()`.
   * Acceptance is required before the pilot period begins.
   *
   * @example
   * await cl.lenderProfile.acceptPilotTerms({ version: "1.0" });
   */
  acceptPilotTerms(params: PilotTermsAcceptParams): Promise<PilotTermsAcceptResponse> {
    return this.client._request<PilotTermsAcceptResponse>(
      "POST",
      "/api/v1/lender/pilot-terms/accept",
      { body: params }
    );
  }

  /**
   * Retrieve an aggregate summary of the lender's monitored portfolio.
   *
   * Returns counts by risk tier, alerts fired in the last 30 days, and
   * average DQ score and monthly revenue across all enrolled verifications.
   * Useful for building a portfolio health dashboard.
   *
   * @example
   * const summary = await cl.lenderProfile.getPortfolioSummary();
   * console.log("Total monitored:", summary.total_monitored);
   * console.log("By tier:", summary.by_tier);
   * console.log("Alerts last 30 days:", summary.alerts_last_30d);
   */
  getPortfolioSummary(): Promise<PortfolioSummaryResponse> {
    return this.client._request<PortfolioSummaryResponse>(
      "GET",
      "/api/v1/lender/portfolio/summary"
    );
  }
}
