import { Creatorlayer } from "../Creatorlayer.js";
import type {
  ListReportsResponse,
  MarketReport,
  GenerateReportParams,
} from "../types.js";

/**
 * Market Intelligence — aggregated, anonymized creator-economy reports.
 * No individual creator data is ever exposed through these endpoints.
 * Requires the "intelligence" sub-permission on your API key.
 */
export class Intelligence {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * List all available reports (metadata only — no full payloads).
   *
   * @example
   * const { reports } = await cl.intelligence.listReports();
   */
  listReports(): Promise<ListReportsResponse> {
    return this.client._request<ListReportsResponse>(
      "GET",
      "/api/v1/intelligence/reports"
    );
  }

  /**
   * Retrieve a single market report by ID (full payload including loan-level trends).
   *
   * @example
   * const report = await cl.intelligence.getReport(reportId);
   * console.log(report.summary.total_creators);
   */
  getReport(reportId: string): Promise<MarketReport> {
    return this.client._request<MarketReport>(
      "GET",
      `/api/v1/intelligence/reports/${reportId}`
    );
  }

  /**
   * Generate a new market report for the specified period and optional filters.
   * Report generation is synchronous — larger periods may take a few seconds.
   *
   * @example
   * const report = await cl.intelligence.generateReport({
   *   period: { start: "2025-01", end: "2025-12" },
   *   filters: { vertical: "gaming" },
   * });
   */
  generateReport(params: GenerateReportParams): Promise<MarketReport> {
    return this.client._request<MarketReport>(
      "POST",
      "/api/v1/intelligence/reports/generate",
      { body: params }
    );
  }
}
