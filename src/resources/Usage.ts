import { Creatorlayer } from "../Creatorlayer.js";
import type { UsageSummary, UsageHistory } from "../types.js";

export class Usage {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Retrieve current usage summary — today's request counts, monthly
   * verification quota, and rate-limit configuration for your plan.
   *
   * @example
   * const usage = await cl.usage.summary();
   * console.log(`${usage.this_month.quota_used_pct}% of monthly quota used`);
   */
  summary(): Promise<UsageSummary> {
    return this.client._request<UsageSummary>("GET", "/api/v1/usage/summary");
  }

  /**
   * Retrieve daily usage history.
   *
   * @param days - Number of days to return (1–90). Default: 30.
   *
   * @example
   * const { history } = await cl.usage.history({ days: 7 });
   */
  history(params: { days?: number } = {}): Promise<UsageHistory> {
    const query: Record<string, string> = {};
    if (params.days !== undefined) query["days"] = String(params.days);
    return this.client._request<UsageHistory>("GET", "/api/v1/usage/history", { query });
  }
}
