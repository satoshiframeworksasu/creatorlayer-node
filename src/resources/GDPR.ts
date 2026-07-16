import type { Creatorlayer } from "../Creatorlayer.js";
import type {
  GDPRLookup,
  GDPRAccessResponse,
  GDPREraseResponse,
  GDPRExportResponse,
} from "../types.js";

export interface GDPRWithdrawConsentParams {
  session_id: string;
  creator_email: string;
}

export interface GDPRWithdrawConsentResponse {
  success: true;
  message: string;
  session_id: string;
  withdrawal_at: string;
  oauth_revoked_platforms: string[];
  oauth_pending_revocation: string[];
}

export interface GDPRWithdrawalRequestParams {
  email: string;
}

export interface GDPRWithdrawalRequestResponse {
  ok: boolean;
}

export interface GDPRWithdrawalConfirmParams {
  token: string;
}

export interface GDPRWithdrawalConfirmResponse {
  ok: boolean;
  sessions_withdrawn: number;
  withdrawal_at: string;
  lender_names: string[];
}

export class GDPR {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Retrieve all data held for a creator.
   * Requires a `gdpr_admin` API key.
   *
   * @example
   * const data = await cl.gdpr.access({ email: "creator@example.com" });
   */
  access(params: GDPRLookup): Promise<GDPRAccessResponse> {
    const query: Record<string, string> = {};
    if (params.email) query.email = params.email;
    if (params.obligor_id) query.obligor_id = params.obligor_id;
    return this.client._request<GDPRAccessResponse>(
      "GET",
      "/api/v1/gdpr/access",
      { query }
    );
  }

  /**
   * Permanently erase all data for a creator (GDPR Art. 17).
   * Requires a `gdpr_admin` API key.
   *
   * @example
   * await cl.gdpr.erase({ email: "creator@example.com" });
   */
  erase(params: GDPRLookup): Promise<GDPREraseResponse> {
    return this.client._request<GDPREraseResponse>(
      "POST",
      "/api/v1/gdpr/erase",
      { body: params }
    );
  }

  /**
   * Export all data for a creator in a portable format (GDPR Art. 20).
   * Returns the full data inline as a JSON attachment.
   * Requires a `gdpr_admin` API key.
   *
   * @example
   * const data = await cl.gdpr.export({ email: "creator@example.com" });
   * console.log(data.export_generated_at, data.verifications);
   */
  export(params: GDPRLookup): Promise<GDPRExportResponse> {
    const query: Record<string, string> = {};
    if (params.email) query.email = params.email;
    if (params.obligor_id) query.obligor_id = params.obligor_id;
    return this.client._request<GDPRExportResponse>(
      "GET",
      "/api/v1/gdpr/export",
      { query }
    );
  }

  /**
   * Withdraw consent for a specific session by session ID and creator email.
   * No authentication required — the session UUID + creator email act as capability tokens.
   *
   * @example
   * await cl.gdpr.withdrawConsent({ session_id: "...", creator_email: "creator@example.com" });
   */
  withdrawConsent(params: GDPRWithdrawConsentParams): Promise<GDPRWithdrawConsentResponse> {
    return this.client._request<GDPRWithdrawConsentResponse>(
      "POST",
      "/api/v1/gdpr/withdraw-consent",
      { body: params }
    );
  }

  /**
   * Request a single-use withdrawal link via email. The creator enters their email
   * and receives a link valid for 72 hours. No authentication required.
   *
   * @example
   * await cl.gdpr.requestWithdrawalLink({ email: "creator@example.com" });
   */
  requestWithdrawalLink(params: GDPRWithdrawalRequestParams): Promise<GDPRWithdrawalRequestResponse> {
    return this.client._request<GDPRWithdrawalRequestResponse>(
      "POST",
      "/api/v1/gdpr/withdrawal-request",
      { body: params }
    );
  }

  /**
   * Confirm a withdrawal using the single-use token from the email link.
   * Atomically withdraws all active consent sessions for the creator.
   *
   * @example
   * const result = await cl.gdpr.confirmWithdrawal({ token: "..." });
   * console.log(`Withdrew ${result.sessions_withdrawn} session(s)`);
   */
  confirmWithdrawal(params: GDPRWithdrawalConfirmParams): Promise<GDPRWithdrawalConfirmResponse> {
    return this.client._request<GDPRWithdrawalConfirmResponse>(
      "POST",
      "/api/v1/gdpr/withdrawal-confirm",
      { body: params }
    );
  }
}
