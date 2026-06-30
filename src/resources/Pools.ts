import type { Creatorlayer } from "../Creatorlayer.js";

export type StratificationDimension =
  | "risk_tier"
  | "product_type"
  | "finance_class"
  | "platform_mix"
  | "revenue_band";

export interface Pool {
  dimension: StratificationDimension;
  segment: string;
  count: number;
  avg_monthly_revenue: number | null;
  avg_volatility_cv: number | null;
  avg_track_record_months: number | null;
}

export interface PoolsListResponse {
  pools: Pool[];
  total_creators: number;
  generated_at: string;
}

export interface PoolsReportResponse extends PoolsListResponse {
  dimensions: StratificationDimension[];
}

export interface PoolDimensionResponse {
  dimension: StratificationDimension;
  pools: Pool[];
  generated_at: string;
}

export class Pools {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Full stratification report — pools across all dimensions.
   *
   * @example
   * const report = await cl.pools.report();
   * console.log(report.pools);
   */
  report(): Promise<PoolsReportResponse> {
    return this.client._request<PoolsReportResponse>("GET", "/api/v1/pools/report");
  }

  /**
   * All pools across all dimensions, without the full report metadata.
   *
   * @example
   * const { pools, total_creators } = await cl.pools.list();
   */
  list(): Promise<PoolsListResponse> {
    return this.client._request<PoolsListResponse>("GET", "/api/v1/pools");
  }

  /**
   * Pools filtered to a single stratification dimension.
   *
   * @param dimension One of: risk_tier, product_type, finance_class, platform_mix, revenue_band
   *
   * @example
   * const { pools } = await cl.pools.listByDimension("risk_tier");
   */
  listByDimension(dimension: StratificationDimension): Promise<PoolDimensionResponse> {
    return this.client._request<PoolDimensionResponse>(
      "GET",
      `/api/v1/pools/${encodeURIComponent(dimension)}`,
    );
  }
}
