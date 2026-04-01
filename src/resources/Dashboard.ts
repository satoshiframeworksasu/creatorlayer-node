import { Creatorlayer } from "../Creatorlayer.js";
import type {
  DashboardStats,
  PipelineView,
  VerificationDetail,
  ListVerificationsParams,
} from "../types.js";

export class Dashboard {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Retrieve aggregate dashboard statistics for your lender account.
   *
   * @example
   * const stats = await cl.dashboard.stats();
   * console.log(stats.avg_creator_score);
   */
  stats(): Promise<DashboardStats> {
    return this.client._request<DashboardStats>("GET", "/api/v1/dashboard/stats");
  }

  /**
   * List verifications with optional filtering and pagination.
   *
   * @example
   * const { verifications, stats } = await cl.dashboard.listVerifications({
   *   status: "completed",
   *   risk_tier: "prime",
   *   page: 1,
   *   per_page: 25,
   * });
   */
  listVerifications(params: ListVerificationsParams = {}): Promise<PipelineView> {
    const query: Record<string, string> = {};
    if (params.page !== undefined) query["page"] = String(params.page);
    if (params.per_page !== undefined) query["per_page"] = String(params.per_page);
    if (params.status) query["status"] = params.status;
    if (params.risk_tier) query["risk_tier"] = params.risk_tier;
    if (params.search) query["search"] = params.search;
    if (params.date_from) query["date_from"] = params.date_from;
    if (params.date_to) query["date_to"] = params.date_to;

    return this.client._request<PipelineView>("GET", "/api/v1/dashboard/verifications", {
      query,
    });
  }

  /**
   * Retrieve detailed information for a single verification, including the
   * full Risk Tape if available.
   *
   * @example
   * const detail = await cl.dashboard.getVerification(verificationId);
   * console.log(detail.creator_score);
   */
  getVerification(verificationId: string): Promise<VerificationDetail> {
    return this.client._request<VerificationDetail>(
      "GET",
      `/api/v1/dashboard/verifications/${verificationId}`
    );
  }
}
