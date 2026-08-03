import type { Creatorlayer } from "../Creatorlayer.js";
import type { MonitorCompletionRow, MonitorDataQualityRow } from "../types.js";

export class Monitor {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Retrieve verification completion rates broken down by status for your
   * lender account.
   *
   * Returns a row per status value (`pending`, `completed`, `failed`, etc.)
   * with a count of verifications in that state.
   *
   * @example
   * const rows = await cl.monitor.completion();
   * const completed = rows.find(r => r.status === 'completed');
   * console.log(`${completed?.count} completed verifications`);
   */
  completion(): Promise<MonitorCompletionRow[]> {
    return this.client._request<MonitorCompletionRow[]>(
      "GET",
      "/api/v1/monitor/completion",
    );
  }

  /**
   * Retrieve data quality distribution across your lender account's verifications.
   *
   * Returns rows for `has_tape` (completed verifications with a Risk Tape) and
   * `no_tape` (verifications where no tape was generated yet).
   *
   * @example
   * const rows = await cl.monitor.dataQuality();
   * const withTape = rows.find(r => r.quality === 'has_tape');
   * console.log(`${withTape?.count} verifications have a Risk Tape`);
   */
  dataQuality(): Promise<MonitorDataQualityRow[]> {
    return this.client._request<MonitorDataQualityRow[]>(
      "GET",
      "/api/v1/monitor/data_quality",
    );
  }
}
