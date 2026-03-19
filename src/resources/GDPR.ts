import type { Creatorlayer } from "../Creatorlayer.js";
import type {
  GDPRLookup,
  GDPRAccessResponse,
  GDPREraseResponse,
  GDPRExportResponse,
} from "../types.js";

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
   * Requires a `gdpr_admin` API key.
   *
   * @example
   * const { export_url } = await cl.gdpr.export({ email: "creator@example.com" });
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
}
