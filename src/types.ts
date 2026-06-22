// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

/**
 * Supported creator platforms for income verification.
 *
 * Revenue platforms (verified_revenue):
 *   adsense, stripe, shopify, etsy, gumroad, sellfy, paddle
 *   amazon — verified_revenue when connected via SP-API; audience_only otherwise
 *
 * Revenue platforms (strong_proxy — estimated, no direct revenue API):
 *   twitch, patreon
 *
 * Audience-only platforms (ND3 — connected via OAuth, no revenue API):
 *   youtube, tiktok, meta, twitter, pinterest, reddit, linkedin, snapchat, discord
 *
 * No public API (ND4 — consent captured, no data fetchable):
 *   substack, medium, telegram, bluesky, vinted
 */
export type Platform =
  // Revenue platforms (verified_revenue)
  | "adsense" | "stripe" | "shopify" | "etsy" | "gumroad" | "sellfy" | "paddle" | "amazon"
  // Revenue platforms (strong_proxy)
  | "twitch" | "patreon"
  // Audience-only (ND3 — no revenue API)
  | "youtube" | "tiktok" | "meta" | "twitter" | "pinterest" | "reddit"
  | "linkedin" | "snapchat" | "discord"
  // No public API (ND4)
  | "substack" | "medium" | "telegram" | "bluesky" | "vinted"
  // Catch-all for unlisted platforms that may appear in Risk Tape output
  | "other";
/**
 * Financial product type. Drives eligibility dispatcher routing.
 * All types are accepted by POST /api/v1/verifications.
 */
export type ProductType =
  | "term_loan"            // Fixed-term amortising loan
  | "rbf"                  // Revenue-Based Financing
  | "revenue_loan"         // Fixed instalment sized off revenue
  | "venture_debt"         // Growth-oriented; tolerates higher volatility
  | "murabaha"             // Islamic finance — cost-plus sale (AAOIFI standard)
  | "hpp"                  // Islamic finance — Home Purchase Plan / Diminishing Musharakah
  | "securitization_pool"; // At individual-tape level for securitization pools
export type VerificationStatus =
  | "pending_creator_consent"
  | "processing"
  | "completed"
  | "failed"
  | "expired";
export type RiskTier = "prime" | "standard" | "subprime" | "ineligible";
export type NDCode = "ND1" | "ND2" | "ND3" | "ND4";
export type WebhookEventType =
  | "verification.completed"
  | "verification.failed"
  | "verification.expired"
  | "tape.updated"
  | "consent.revoked";

// ---------------------------------------------------------------------------
// Verifications
// ---------------------------------------------------------------------------

export interface CreateVerificationParams {
  /** Your internal identifier for the creator. Max 100 characters. No PII. */
  obligor_reference: string;
  /** Name of your organisation shown to the creator on the consent page. */
  lender_name?: string;
  /** Financial product type. Defaults to "rbf" if omitted. */
  product_type?: ProductType;
  /** Creator email address — pre-fills the consent UI if provided. Creatorlayer does not proactively email the creator; the lender delivers the consent_url through their own channel. */
  creator_email?: string;
  /** ISO 639-1 language code for the consent UI. Defaults to "en". */
  language?: string;
  /**
   * Where to redirect the creator after they complete or decline the consent flow.
   * Must be an https:// URL. The verification_id and status are appended as query
   * params: `?verification_id=ver_…&status=completed`.
   * Omit to show the default Creatorlayer success/decline screen instead.
   */
  return_url?: string;
  /**
   * Per-verification webhook endpoint. Receives a `verification.completed` event
   * when the creator finishes the consent flow. Overrides the account-level webhook
   * URL set on the lender profile.
   */
  webhook_url?: string;
  /**
   * Opaque reference string (max 200 characters). Passed through to webhook payloads
   * and returned on GET /verifications/:id. Use to correlate with your internal loan
   * or application ID.
   */
  custom_reference?: string;
}

export interface VerificationCreated {
  verification_id: string;
  /** Echoed from request — your internal creator ID. */
  obligor_reference: string;
  /** Echoed from request — financial product type. */
  product_type: string;
  status: "pending_creator_consent";
  /** Send this URL to the creator so they can connect their platforms. */
  consent_url: string;
  /** ISO 8601. Consent session expires after 7 days. */
  expires_at: string;
  created_at: string;
  lender_id: string;
  /** Echoed from request if provided. */
  return_url?: string;
  /** Echoed back from the request if provided. */
  custom_reference?: string;
}

export interface VerificationStatus_ {
  verification_id: string;
  status: VerificationStatus;
  obligor_reference: string;
  created_at: string;
  updated_at: string;
  /** Financial product type the verification was created with. */
  product_type?: ProductType;
  consent_url?: string | null;
  webhook_url?: string | null;
  custom_reference?: string | null;
}

// ---------------------------------------------------------------------------
// Risk Tape
// ---------------------------------------------------------------------------

/** Machine-readable covenant attached to an eligibility decision. */
export interface Covenant {
  code: string;
  description: string;
  metric: string;
  threshold: number;
  window_months: number;
  measurement_frequency: "monthly" | "quarterly";
}

export interface EligibilityResult {
  product_type: ProductType;
  eligible: boolean;
  risk_tier: RiskTier;
  max_advance_amount: number | null;
  max_revenue_share_pct?: number | null;
  payback_cap_multiple?: number | null;
  max_tenor_months?: number | null;
  dscr_stressed?: number | null;
  stressed_net_income?: number | null;
  dti_ratio?: number | null;
  sharia_eligible?: boolean | null;
  murabaha_viable?: boolean | null;
  diminishing_musharakah_viable?: boolean | null;
  income_stability_score?: number | null;
  income_trend?: "growing" | "stable" | "declining" | "insufficient_data" | null;
  /** CRA-style forward-looking outlook. */
  outlook?: "positive" | "stable" | "negative" | null;
  /** True when risk_tier was downgraded due to insufficient data quality. */
  dq_capped?: boolean;
  /** Contract-neutral alias for max_advance_amount. */
  income_capacity_annual?: number | null;
  /** Contract-neutral alias for max_revenue_share_pct. */
  recommended_monthly_ceiling_pct?: number | null;
  flags: Array<{ code: string }>;
  covenants: Covenant[];
  /** Thresholds applied to reach this decision — lenders can use this to verify the tier. */
  applied_thresholds?: Record<string, number | string[]>;
}

export interface RiskTape {
  schema_version: string;
  methodology_version?: string;
  verification_id: string;
  as_of_date: string;
  status: string;
  /** "conventional" for standard products; "islamic" for murabaha / hpp. */
  finance_class?: "conventional" | "islamic";
  obligor: {
    obligor_id: string;
    jurisdiction?: string | null;
    creator_vertical?: string | null;
    creator_size_band?: "nano" | "micro" | "mid" | "macro" | "mega" | null;
    legal_name?: string | null;
  };
  platform_connections: Array<{
    platform: Platform;
    handle_or_channel_id?: string | null;
    role: "revenue" | "audience";
    /**
     * verified_revenue — direct API revenue data.
     * strong_proxy     — estimated from engagement/subscription signals.
     * audience_only    — identity/audience signal only; no revenue contribution.
     * fx_excluded      — revenue fetched but ECB normalisation unavailable.
     */
    data_quality: "verified_revenue" | "strong_proxy" | "audience_only" | "fx_excluded";
    consent_status: "active" | "revoked" | "expired";
    first_sync_at: string;
    last_sync_at: string;
    account_created_date?: string | null;
    nd_code?: NDCode | null;
    platform_data?: Record<string, unknown> | null;
  }>;
  cashflow_summary: {
    currency: string;
    track_record_months: number;
    income_30d: number | null;
    income_90d: number | null;
    avg_monthly_revenue: number | null;
    median_monthly_revenue?: number | null;
    revenue_monthly: Array<{
      month: string;
      gross_amount: number | null;
      nd_code?: NDCode | null;
    }>;
    platform_totals?: Record<string, number>;
    top_platform_share?: number | null;
  };
  risk_profile: {
    avg_monthly_revenue: number | null;
    volatility_cv_12m: number | null;
    max_drawdown_pct_36m: number | null;
    platform_concentration_index: number | null;
    top_platform_share: number | null;
    track_record_months: number;
    yoy_growth_pct?: number | null;
    income_trend_slope_pct?: number | null;
    seasonal_adjustment_flag?: boolean | null;
    high_risk_platform_flag?: boolean | null;
    dispute_rate?: number | null;
    platform_dependency_flag?: boolean | null;
  };
  eligibility: EligibilityResult[];
  data_quality: {
    overall_score: number;
    completeness_score: number;
    nd_score: number;
    consistency_score: number;
    nd_breakdown: { ND1: number; ND2: number; ND3: number; ND4: number };
    mandatory_fields_missing: string[];
    quality_flags: string[];
  };
  /**
   * FX normalisation audit trail. Present when at least one platform revenue
   * was denominated in a non-EUR currency and successfully converted via ECB rates.
   * Null when all platforms reported EUR natively or when ECB rates were unavailable.
   */
  fx_context?: {
    as_of_date: string;
    rate_source: string;
    converted_platforms: Array<{ platform: string; original_currency: string }>;
    rates_applied: Record<string, number>;
    excluded_platforms?: string[];
  } | null;
  /** Present on murabaha and hpp tapes only. */
  islamic_compliance?: {
    sharia_eligible: boolean | null;
    status: "permissible" | "flagged" | "insufficient_data";
    screening_provider: string;
    screened_at: string;
  } | null;
  jurisdiction_profile?: {
    jurisdiction: string;
    data_protection_regime: string;
    gdpr_applies: boolean;
  } | null;
  overlay_blocks?: Array<{
    provider: string;
    block_type: string;
    data: Record<string, unknown>;
  }>;
}

/** A platform whose OAuth data is older than the 30-day freshness window. */
export interface StalePlatform {
  /** Platform identifier, e.g. "youtube", "twitch", "patreon". */
  platform: string;
  /** ISO 8601 timestamp of the last successful OAuth sync for this platform. */
  last_sync_at: string;
  /** Days elapsed since last_sync_at at the time of this tape request. */
  age_days: number;
}

/** Response envelope for GET /verifications/:id/tape. */
export interface TapeResponse {
  tape: RiskTape;
  /**
   * Compact ES256 JWT. Verify offline: fetch public key from GET /.well-known/jwks.json,
   * verify signature, then check revocation via POST /api/v1/risk-tapes/verify.
   * Null when TAPE_SIGNING_PRIVATE_KEY is not configured on the API server.
   */
  signed_jwt: string | null;
  /**
   * Present only when one or more platforms have not been synced within the last 30 days.
   * The tape is still delivered — this is informational. Absent when all platforms are fresh.
   */
  stale_platforms?: StalePlatform[];
}

/** Response from GET /verifications/:id/eligibility — free, no tape decryption. */
export interface EligibilityCheck {
  verification_id: string;
  eligible: boolean | null;
  risk_tier: RiskTier | null;
  /** Present when tape not yet computed (creator consent may be pending). */
  status?: string;
  note?: string;
}

// ── Portfolio monitoring ──────────────────────────────────────────────────────

/** A row returned by GET /verifications/monitored. */
export interface MonitoredTapeRow {
  verification_id: string;
  enrolled_at: string;
  last_checked_at: string | null;
  last_alert_at: string | null;
  baseline_avg_revenue: number | null;
  alert_threshold_pct: number;
  /** Recurring billing amount in euro cents per month. Default 500 = €5.00. */
  monthly_rate_cents: number;
  obligor_reference: string;
  product_type: ProductType;
  verification_status: string;
}

/** Response envelope for GET /verifications/monitored. */
export interface MonitoredVerificationsResponse {
  monitored: MonitoredTapeRow[];
}

/** Parameters for POST /verifications/:id/monitor. */
export interface EnrollMonitoringParams {
  /** Income drop (%) that triggers an alert. Default 20. */
  alert_threshold_pct?: number;
}

/** Response from POST /verifications/:id/monitor. */
export interface EnrollMonitoringResponse {
  enrolled: true;
  verification_id: string;
  baseline_avg_revenue: number | null;
  alert_threshold_pct: number;
  enrolled_at: string;
  /** Recurring billing amount in euro cents per month. Default 500 = €5.00. */
  monthly_rate_cents: number;
}

/** Response from DELETE /verifications/:id/monitor. */
export interface UnenrollMonitoringResponse {
  enrolled: false;
  verification_id: string;
}

/** Result of POST /api/v1/risk-tapes/verify. */
export interface TapeVerifyResult {
  valid: boolean;
  revoked: boolean;
  expired: boolean;
  verification_id?: string;
  obligor_id?: string;
  /** ISO 8601 expiry timestamp. Present on valid tokens. */
  expires_at?: string;
  /** "token_expired" | "invalid_signature" | "signing_not_configured" */
  error?: string;
}

/** Response from GET /.well-known/jwks.json. */
export interface JwksResponse {
  keys: Array<Record<string, unknown>>;
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

export interface WebhookDelivery {
  delivery_id: string;
  webhook_id: string;
  event: WebhookEventType;
  url: string;
  http_status: number | null;
  success: boolean;
  attempted_at: string;
  duration_ms: number | null;
}

export interface WebhookDeliveriesResponse {
  deliveries: WebhookDelivery[];
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
  created_at: string;
  completed_at: string | null;
}

export interface DashboardStats {
  total_verifications: number;
  completed: number;
  pending: number;
  failed: number;
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
  /** CRA-style pool quality score (0–100). null when pool has no tapes. */
  pool_score: number | null;
  /**
   * Letter rating derived from pool_score. A ≥ 70 · B ≥ 50 · C ≥ 30 · D < 30.
   * ESMA RTS 2017/592.
   */
  pool_rating: 'A' | 'B' | 'C' | 'D' | null;
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
// Consent Sessions
// ---------------------------------------------------------------------------

export interface CreateConsentSessionParams {
  /** The verification_id of an existing pending-consent verification. */
  verification_id: string;
  /** Display name of your organisation shown to the creator in the consent UI. */
  lender_name: string;
  /** Creator email — pre-fills the consent UI if provided. */
  creator_email?: string;
  /** ISO 639-1 language code for the consent UI. Defaults to "en". */
  language?: string;
  /** ISO 4217 currency code for revenue normalisation. Defaults to "EUR". */
  payout_currency?: string;
  /**
   * Where to redirect the creator after they complete or decline the consent flow.
   * Must be an https:// URL. The verification_id and status are appended as query
   * params: `?verification_id=ver_…&status=completed`.
   */
  return_url?: string;
}

export interface ConsentSessionCreated {
  consent_session_id: string;
  /** URL to deliver to the creator so they can complete the consent flow. */
  consent_url: string;
  /** ISO 8601. Session expires 7 days after creation. */
  expires_at: string;
}

export interface ConsentSessionStatus {
  id: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  lender_name: string;
  lender_logo: string | null;
  creator_email: string | null;
  return_url: string | null;
  expires_at: string;
  payout_currency: string;
  verification_id: string;
  created_at: string;
  language: string;
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
