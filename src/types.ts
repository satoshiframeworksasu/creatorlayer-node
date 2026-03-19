// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

export type Platform = "youtube" | "stripe";
export type ProductType = "rbf";
export type VerificationStatus =
  | "pending_consent"
  | "processing"
  | "completed"
  | "failed"
  | "expired";
export type RiskTier = "prime" | "standard" | "subprime" | "ineligible";
export type NDCode = "ND1" | "ND2" | "ND3" | "ND4";
export type WebhookEventType =
  | "verification.completed"
  | "verification.failed"
  | "verification.expired";

// ---------------------------------------------------------------------------
// Verifications
// ---------------------------------------------------------------------------

export interface CreateVerificationParams {
  /** Your internal identifier for the creator. Max 100 characters. No PII. */
  obligor_reference: string;
  /** Platforms to verify. At least one required. */
  creator_platforms: Platform[];
  /** Name of your organisation shown to the creator on the consent page. */
  lender_name?: string;
  /** Financial product type. Currently only "rbf". */
  product_type?: ProductType;
}

export interface VerificationCreated {
  verification_id: string;
  status: "pending_consent";
  /** Send this URL to the creator so they can connect their platforms. */
  consent_url: string;
  /** ISO 8601. Consent session expires after 7 days. */
  expires_at: string;
}

export interface VerificationStatus_ {
  verification_id: string;
  status: VerificationStatus;
  obligor_reference: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Risk Tape
// ---------------------------------------------------------------------------

export interface RiskTape {
  schema_version: string;
  verification_id: string;
  as_of_date: string;
  status: string;
  obligor: {
    reference: string;
    creator_platforms: Platform[];
  };
  platform_connections: Array<{
    platform: Platform;
    connected_at: string;
    status: "ok" | "error" | "pending";
    nd_code: NDCode | null;
  }>;
  cashflow_summary: {
    currency: string;
    total_revenue_12m: number | null;
    total_revenue_3m: number | null;
    avg_monthly_revenue_12m: number | null;
    revenue_by_platform: Record<string, number>;
  };
  risk_profile: {
    volatility_cv_12m: number | null;
    max_drawdown_pct_36m: number | null;
    platform_concentration_index: number | null;
    trend_slope_6m: number | null;
  };
  eligibility: Array<{
    product_type: ProductType;
    risk_tier: RiskTier;
    max_advance_eur: number | null;
    flags: string[];
    covenants: string[];
  }>;
  data_quality: {
    score: number;
    tier_a_fields_present: number;
    nd_summary: {
      ND1: number;
      ND2: number;
      ND3: number;
      ND4: number;
    };
  };
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

export interface BenchmarkMetric {
  value: number | null;
  percentile: number | null;
  peer_median: number | null;
  population_size: number | null;
}

export interface Benchmarks {
  verification_id: string;
  as_of_date: string;
  peer_group: {
    definition: string;
    population_size: number;
  };
  metrics: {
    volatility_cv_12m: BenchmarkMetric;
    max_drawdown_pct_36m: BenchmarkMetric;
    platform_concentration_index: BenchmarkMetric;
  };
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export interface CreateWebhookParams {
  /** Public HTTPS URL that will receive POST requests. */
  url: string;
  events: WebhookEventType[];
}

export interface Webhook {
  webhook_id: string;
  url: string;
  events: WebhookEventType[];
  created_at: string;
}

export interface WebhookEventPayload {
  event: WebhookEventType;
  verification_id: string;
  obligor_reference: string;
  occurred_at: string;
  /** Only present on verification.failed events. */
  reason?: "platform_error" | "consent_revoked" | "timeout";
}

// ---------------------------------------------------------------------------
// GDPR
// ---------------------------------------------------------------------------

export interface GDPRLookup {
  /** At least one of email or obligor_id is required. */
  email?: string;
  obligor_id?: string;
}

export interface GDPRAccessResponse {
  email: string | null;
  obligor_id: string | null;
  verifications: Array<{
    verification_id: string;
    created_at: string;
    platforms: Platform[];
  }>;
}

export interface GDPREraseResponse {
  erased: true;
  erased_at: string;
}

export interface GDPRExportResponse {
  export_url: string;
  expires_at: string;
}

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

export interface CreatorlayerOptions {
  /** Your API key. Keep this server-side only — never expose in the browser. */
  apiKey: string;
  /**
   * Use the sandbox environment for testing.
   * Equivalent to setting baseUrl to "https://sandbox-api.creatorlayer.eu".
   */
  sandbox?: boolean;
  /**
   * Override the base URL. Useful for testing against a local server.
   * Takes precedence over `sandbox`.
   */
  baseUrl?: string;
  /** Maximum number of retries for 429/503 responses. Default: 2. */
  maxRetries?: number;
  /** Request timeout in milliseconds. Default: 30000. */
  timeout?: number;
}
