import { Creatorlayer } from "../Creatorlayer.js";
import type {
  SecuritizationPool,
  PoolDetail,
  LoanLevelResponse,
  EsmaPoolReport,
  CreatePoolParams,
  AddToPoolParams,
} from "../types.js";

/**
 * Securitization — ESMA RTS 2017/592-compliant pool management and reporting.
 * Create pools of verified creators, add tapes by criteria, and export
 * loan-level data or full ESMA-format reports.
 */
export class Securitization {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Create a new securitization pool with optional eligibility criteria.
   *
   * @example
   * const pool = await cl.securitization.create({
   *   name: "Q1 2026 Prime Pool",
   *   criteria: { max_risk_tier: "standard", min_track_record_months: 12 },
   * });
   */
  create(params: CreatePoolParams): Promise<SecuritizationPool> {
    return this.client._request<SecuritizationPool>(
      "POST",
      "/api/v1/securitization",
      { body: params }
    );
  }

  /**
   * Retrieve pool metadata and composition statistics.
   *
   * @example
   * const { pool, composition } = await cl.securitization.get(poolId);
   * console.log(`${composition.creator_count} creators, total exposure: ${composition.total_exposure}`);
   */
  get(poolId: string): Promise<PoolDetail> {
    return this.client._request<PoolDetail>(
      "GET",
      `/api/v1/securitization/${poolId}`
    );
  }

  /**
   * Add verified creators to a pool. Only verifications that meet the pool's
   * criteria will be admitted; the rest are silently skipped.
   *
   * @example
   * const { composition } = await cl.securitization.addToPool(poolId, {
   *   verification_ids: ["ver_abc123", "ver_def456"],
   * });
   */
  addToPool(poolId: string, params: AddToPoolParams): Promise<{ composition: PoolDetail["composition"] }> {
    return this.client._request(
      "POST",
      `/api/v1/securitization/${poolId}/add`,
      { body: params }
    );
  }

  /**
   * Export loan-level data for a pool in JSON format (ESMA field mapping).
   * For CSV output, call `loanLevelCsv()` instead.
   *
   * @example
   * const { loan_level_data } = await cl.securitization.loanLevel(poolId);
   */
  loanLevel(poolId: string): Promise<LoanLevelResponse> {
    return this.client._request<LoanLevelResponse>(
      "GET",
      `/api/v1/securitization/${poolId}/loan-level`
    );
  }

  /**
   * Generate a full ESMA-format pool report including composition, loan-level
   * data and ND code definitions.
   *
   * @example
   * const report = await cl.securitization.report(poolId);
   * console.log(report.esma_schema_version);
   */
  report(poolId: string): Promise<EsmaPoolReport> {
    return this.client._request<EsmaPoolReport>(
      "GET",
      `/api/v1/securitization/${poolId}/report`
    );
  }
}
