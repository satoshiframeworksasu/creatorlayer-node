import { Creatorlayer } from "../Creatorlayer.js";
import type {
  CreatorIndex,
  IndexHistoryResponse,
  IndexComponentsResponse,
} from "../types.js";

/**
 * Creator Economy Index — a composite index tracking creator-economy health
 * over time. Conceptually the "S&P 500 for creator income." Base = 1000 at
 * the first month with sufficient population. Public endpoint; no auth required.
 */
export class EconomyIndex {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Retrieve the latest index snapshot.
   *
   * @example
   * const index = await cl.economyIndex.latest();
   * console.log(`Creator Economy Index: ${index.value} (${index.date})`);
   */
  latest(): Promise<CreatorIndex> {
    return this.client._request<CreatorIndex>("GET", "/api/v1/index/latest");
  }

  /**
   * Retrieve the full historical series, chronologically ordered.
   *
   * @example
   * const { history } = await cl.economyIndex.history();
   */
  history(): Promise<IndexHistoryResponse> {
    return this.client._request<IndexHistoryResponse>("GET", "/api/v1/index/history");
  }

  /**
   * Retrieve the component breakdown for the latest month.
   *
   * @example
   * const { components } = await cl.economyIndex.components();
   */
  components(): Promise<IndexComponentsResponse> {
    return this.client._request<IndexComponentsResponse>("GET", "/api/v1/index/components");
  }
}
