import type { Creatorlayer } from "../Creatorlayer.js";
import type { LenderThresholds, LenderThresholdsResponse, LenderThresholdHistoryResponse } from "../types.js";

export class LenderThresholdsResource {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Retrieve the current eligibility thresholds for this lender.
   *
   * Returns three views of the threshold configuration:
   * - `defaults` — the platform-wide reference policy (read-only)
   * - `overrides` — the values this lender has customised (empty if none)
   * - `effective` — the merged result used on every eligibility decision
   *
   * @example
   * const { effective } = await cl.lenderThresholds.get();
   * console.log(effective.prime_max_cv);
   */
  get(): Promise<LenderThresholdsResponse> {
    return this.client._request<LenderThresholdsResponse>(
      "GET",
      "/api/v1/lender/thresholds"
    );
  }

  /**
   * Update the eligibility threshold overrides for this lender.
   *
   * Pass only the fields you want to override — unspecified fields continue
   * to use the platform defaults. Pass an empty object `{}` to clear all
   * overrides and revert entirely to the platform reference policy.
   *
   * Changes take effect on the next verification request. Existing Risk Tapes
   * are not retroactively re-scored — the `applied_thresholds` field on each
   * `EligibilityDecision` records which thresholds were in force when the tape
   * was built.
   *
   * Every change is recorded in the threshold audit history.
   *
   * @example
   * // Tighten CV caps for prime underwriting
   * const { effective } = await cl.lenderThresholds.update({
   *   prime_max_cv: 0.20,
   *   min_track_record_months: 9,
   * });
   *
   * @example
   * // Revert to platform defaults
   * await cl.lenderThresholds.update({});
   */
  update(overrides: LenderThresholds): Promise<LenderThresholdsResponse & { updated_at: string }> {
    return this.client._request<LenderThresholdsResponse & { updated_at: string }>(
      "PUT",
      "/api/v1/lender/thresholds",
      { body: overrides }
    );
  }

  /**
   * Retrieve the threshold change history for this lender (last 50 entries,
   * newest first).
   *
   * Each entry includes the new thresholds, the previous values, the
   * timestamp, and the source IP address of the caller.
   *
   * @example
   * const { history } = await cl.lenderThresholds.history();
   * const last = history[0];
   * console.log(last.changed_at, last.thresholds);
   */
  history(): Promise<LenderThresholdHistoryResponse> {
    return this.client._request<LenderThresholdHistoryResponse>(
      "GET",
      "/api/v1/lender/thresholds/history"
    );
  }
}
