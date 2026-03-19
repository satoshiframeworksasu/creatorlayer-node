import { randomUUID } from "crypto";
import { CreatorlayerOptions } from "./types.js";
import {
  CreatorlayerError,
  CreatorlayerAuthError,
  CreatorlayerForbiddenError,
  CreatorlayerNotFoundError,
  CreatorlayerValidationError,
  CreatorlayerDuplicateError,
  CreatorlayerRateLimitError,
  CreatorlayerServerError,
} from "./errors.js";
import { Verifications } from "./resources/Verifications.js";
import { Benchmarks } from "./resources/Benchmarks.js";
import { Webhooks } from "./resources/Webhooks.js";
import { GDPR } from "./resources/GDPR.js";

const PRODUCTION_URL = "https://api.creatorlayer.eu";
const SANDBOX_URL = "https://sandbox-api.creatorlayer.eu";

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_TIMEOUT = 30_000;

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  /** If false, skip auto-retry on 429/503. Default: true. */
  retry?: boolean;
}

export class Creatorlayer {
  readonly verifications: Verifications;
  readonly benchmarks: Benchmarks;
  readonly webhooks: Webhooks;
  readonly gdpr: GDPR;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeout: number;

  constructor(options: CreatorlayerOptions) {
    if (!options.apiKey) {
      throw new Error("apiKey is required");
    }
    this.apiKey = options.apiKey;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.baseUrl =
      options.baseUrl ??
      (options.sandbox ? SANDBOX_URL : PRODUCTION_URL);

    this.verifications = new Verifications(this);
    this.benchmarks = new Benchmarks(this);
    this.webhooks = new Webhooks(this);
    this.gdpr = new GDPR(this);
  }

  // ---------------------------------------------------------------------------
  // Internal HTTP client — used by resource classes
  // ---------------------------------------------------------------------------

  async _request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this._buildUrl(path, options.query);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "creatorlayer-node/0.1.0",
      ...options.headers,
    };

    const body =
      options.body !== undefined ? JSON.stringify(options.body) : undefined;

    return this._executeWithRetry<T>(method, url, headers, body, options.retry ?? true);
  }

  // ---------------------------------------------------------------------------
  // Retry logic
  // ---------------------------------------------------------------------------

  private async _executeWithRetry<T>(
    method: string,
    url: string,
    headers: Record<string, string>,
    body: string | undefined,
    autoRetry: boolean,
    attempt = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort =
        err instanceof Error && err.name === "AbortError";
      throw new CreatorlayerError(
        isAbort ? `Request timed out after ${this.timeout}ms` : String(err),
        0,
        "network_error"
      );
    } finally {
      clearTimeout(timer);
    }

    // Retry on 429 — respect Retry-After
    if (response.status === 429 && autoRetry && attempt < this.maxRetries) {
      const retryAfter = parseInt(response.headers.get("Retry-After") ?? "5", 10);
      await sleep(retryAfter * 1000);
      return this._executeWithRetry(method, url, headers, body, autoRetry, attempt + 1);
    }

    // Retry on 503 — exponential backoff
    if (response.status === 503 && autoRetry && attempt < this.maxRetries) {
      await sleep(1000 * Math.pow(2, attempt));
      return this._executeWithRetry(method, url, headers, body, autoRetry, attempt + 1);
    }

    if (!response.ok) {
      await this._throwError(response);
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  }

  // ---------------------------------------------------------------------------
  // Error mapping
  // ---------------------------------------------------------------------------

  private async _throwError(response: Response): Promise<never> {
    let payload: { error?: string; message?: string } = {};
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      // ignore parse failure
    }

    const message = payload.message ?? payload.error ?? response.statusText;
    const code = payload.error ?? "unknown";

    switch (response.status) {
      case 400:
        throw new CreatorlayerValidationError(message, code);
      case 401:
        throw new CreatorlayerAuthError(message);
      case 403:
        throw new CreatorlayerForbiddenError(message);
      case 404:
        throw new CreatorlayerNotFoundError(message);
      case 409:
        throw new CreatorlayerDuplicateError(message);
      case 422:
        throw new CreatorlayerValidationError(message, "unprocessable");
      case 429: {
        const retryAfter = parseInt(
          response.headers.get("Retry-After") ?? "60",
          10
        );
        throw new CreatorlayerRateLimitError(message, retryAfter);
      }
      case 500:
      case 503:
        throw new CreatorlayerServerError(message, response.status);
      default:
        throw new CreatorlayerError(message, response.status, code);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private _buildUrl(path: string, query?: Record<string, string>): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  /** Generate a UUID v4 idempotency key. */
  static generateIdempotencyKey(): string {
    return randomUUID();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
