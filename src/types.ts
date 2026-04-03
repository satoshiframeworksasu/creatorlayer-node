// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

/**
 * Supported creator platforms for income verification.
 *
 * Revenue platforms — contribute cashflow data to the Risk Tape:
 *   youtube, stripe, twitch, patreon, shopify, etsy, gumroad
 *
 * Audience platforms — strengthen creator profile (ND3, no revenue signal):
 *   tiktok, meta, twitter, pinterest, reddit, linkedin, snapchat, discord, amazon
 *
 * No public API platforms — profile verification only (ND4):
 *   substack, medium, telegram, bluesky, vinted
 */
export type Platform =
  // Revenue platforms
  | "youtube" | "stripe" | "twitch" | "patreon" | "shopify" | "etsy" | "gumroad"
  // Audience platforms (ND3 — no revenue API)
  | "tiktok" | "meta" | "twitter" | "pinterest" | "reddit"
  | "linkedin" | "snapchat" | "discord" | "amazon"
  // No public API (ND4 — profile verification only)
  | "substack" | "medium" | "telegram" | "bluesky" | "vinted";
/**
 * Financial product type. Drives eligibility dispatcher routing.
 * All types are accepted by POST /api/v1/verifications.
 */
export type ProductType =
  | "rbf"                  // Revenue-Based Financing
  | "term_loan"            // Fixed-term amortising loan
  | "revenue_loan"         // Fixed instalment sized off revenue
  | "venture_debt"         // Growth-oriented; tolerates higher volatility
  | "murabaha"             // Sharia-compliant cost-plus sale structure
  | "hpp"                  // Home Purchase Plan (Islamic mortgage equivalent)
  | "securitization_pool"; // At individual-tape level for securitization pools
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
  /** Creator email address — pre-fills the consent UI and sends a consent link if provided. */
  creator_email?: string;
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
    /** Overall data quality score 0–100. Also available as `overall_score`. */
    score: number;
    /** Alias for `score` — matches the API response field `overall_score`. */
    overall_score?: number;
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
// Dashboard
// ---------------------------------------------------------------------------

export type DashboardVerificationStatus =
  | "pending_creator_consent"
  | "pending_tape"
  | "completed"
  | "failed"
  | "expired";

export type RiskTierFilter = "prime" | "standard" | "subprime" | "ineligible";

export interface DashboardVerificationSummary {
  verification_id: string;
  obligor_reference: string;
  status: DashboardVerificationStatus;
  risk_tier: RiskTier | null;
  creator_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface DashboardStats {
  total_verifications: number;
  completed: number;
  pending: number;
  failed: number;
  avg_creator_score: number | null;
  risk_tier_distribution: {
    prime: number;
    standard: number;
    subprime: number;
    ineligible: number;
  };
  verifications_this_month: number;
  verifications_last_month: number;
}

export interface PipelineView {
  verifications: DashboardVerificationSummary[];
  stats: DashboardStats;
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface VerificationDetail {
  verification_id: string;
  obligor_reference: string;
  status: DashboardVerificationStatus;
  product_type: string;
  consent_url: string | null;
  created_at: string;
  updated_at: string;
  tape: RiskTape | null;
  creator_score: number | null;
}

export interface ListVerificationsParams {
  page?: number;
  per_page?: number;
  status?: DashboardVerificationStatus;
  risk_tier?: RiskTierFilter;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

export interface UsageSummary {
  lender_id: string;
  plan_tier: string;
  today: {
    total_requests: number;
    verifications_created: number;
    tapes_completed: number;
    errors: number;
  };
  this_month: {
    verifications_created: number;
    quota: number | null;
    quota_used_pct: number | null;
  };
  rate_limits: {
    minute_limit: number;
    day_limit: number;
  };
}

export interface UsageDayEntry {
  date: string;
  total_requests: number;
  verifications_created: number;
  tapes_completed: number;
  errors: number;
}

export interface UsageHistory {
  lender_id: string;
  days: number;
  history: UsageDayEntry[];
}

// ---------------------------------------------------------------------------
// Creator Economy Index
// ---------------------------------------------------------------------------

export interface IndexComponent {
  name: string;
  weight: number;
  value: number;
  change_1m: number | null;
}

export interface CreatorIndex {
  index_id: string;
  date: string;
  value: number;
  change_1m: number | null;
  change_3m: number | null;
  change_12m: number | null;
  components: IndexComponent[];
  methodology_version: string;
}

export interface IndexHistoryResponse {
  history: CreatorIndex[];
  count: number;
}

export interface IndexComponentsResponse {
  date: string;
  index_value: number;
  components: IndexComponent[];
  methodology_version: string;
}

// ---------------------------------------------------------------------------
// Market Intelligence
// ---------------------------------------------------------------------------

export interface ReportPeriod {
  start: string; // YYYY-MM
  end: string;   // YYYY-MM
}

export interface ReportFilters {
  vertical?: string;
  jurisdiction?: string;
  size_band?: string;
}

export interface MarketReportSummary {
  report_id: string;
  title: string;
  period: ReportPeriod;
  generated_at: string;
  total_creators: number;
}

export interface TopVertical {
  vertical: string;
  count: number;
  avg_revenue: number;
}

export interface SegmentAnalysis {
  dimension: string;
  value: string;
  count: number;
  metrics: Record<string, unknown>;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TrendData {
  metric: string;
  periods: TrendPoint[];
}

export interface MarketReport {
  report_id: string;
  title: string;
  period: ReportPeriod;
  generated_at: string;
  summary: {
    total_creators: number;
    total_revenue_volume: number;
    avg_creator_score: number;
    avg_volatility: number;
    yoy_growth: number | null;
    top_verticals: TopVertical[];
  };
  segments: SegmentAnalysis[];
  trends: TrendData[];
  methodology: string;
}

export interface ListReportsResponse {
  reports: MarketReportSummary[];
}

export interface GenerateReportParams {
  period: ReportPeriod;
  filters?: ReportFilters;
}

// ---------------------------------------------------------------------------
// Securitization
// ---------------------------------------------------------------------------

export interface PoolCriteria {
  min_creator_score: number | null;
  max_risk_tier: RiskTier | null;
  min_data_quality: number | null;
  jurisdictions: string[] | null;
  verticals: string[] | null;
  min_track_record_months: number | null;
}

export interface SecuritizationPool {
  pool_id: string;
  name: string;
  criteria: PoolCriteria;
  created_at: string;
  verification_ids: string[];
}

export interface DataQualityDistribution {
  avg_score: number | null;
  nd1_total: number;
  nd2_total: number;
  nd3_total: number;
  nd4_total: number;
}

export interface PoolComposition {
  pool_id: string;
  creator_count: number;
  total_exposure: number;
  weighted_avg_risk_tier: string;
  risk_tier_distribution: Record<string, number>;
  geographic_distribution: Record<string, number>;
  vertical_distribution: Record<string, number>;
  data_quality_distribution: DataQualityDistribution;
}

export interface PoolDetail {
  pool: SecuritizationPool;
  composition: PoolComposition;
}

export interface LoanLevelEntry {
  obligor_reference: string;
  jurisdiction: string;
  entity_type: string;
  risk_tier: string;
  exposure_amount: number | null;
  origination_date: string;
  maturity_date: string | null;
  monthly_revenue_avg: number | null;
  volatility_cv: number | null;
  max_drawdown: number | null;
  hhi: number | null;
  data_quality_score: number;
  nd_breakdown: { ND1: number; ND2: number; ND3: number; ND4: number };
}

export interface LoanLevelResponse {
  pool_id: string;
  count: number;
  loan_level_data: LoanLevelEntry[];
}

export interface EsmaPoolReport {
  report_id: string;
  pool_id: string;
  pool_name: string;
  generated_at: string;
  reporting_entity: string;
  esma_schema_version: string;
  composition: PoolComposition;
  loan_level_data: LoanLevelEntry[];
  nd_code_definitions: { ND1: string; ND2: string; ND3: string; ND4: string };
}

export interface CreatePoolParams {
  name: string;
  criteria?: Partial<PoolCriteria>;
}

export interface AddToPoolParams {
  verification_ids: string[];
}

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

export interface CreatorlayerOptions {
  /** Your API key. Keep this server-side only — never expose in the browser. */
  apiKey: string;
  /**
   * Use the sandbox environment for testing.
   * Equivalent to setting baseUrl to "https://api-sandbox.creatorlayer.eu".
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
