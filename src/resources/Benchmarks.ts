import type { Creatorlayer } from "../Creatorlayer.js";
import type { Benchmarks as BenchmarksResponse } from "../types.js";

export class Benchmarks {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Compare a creator's risk metrics against the full population.
   * Returns percentile ranks. Only available after status is `completed`.
   *
   * @example
   * const bench = await cl.benchmarks.retrieve(verificationId);
   * console.log(bench.metrics.volatility_cv_12m.percentile); // e.g. 34
   */
  retrieve(verificationId: string): Promise<BenchmarksResponse> {
    return this.client._request<BenchmarksResponse>(
      "GET",
      `/api/v1/benchmarks/${verificationId}`
    );
  }
}
