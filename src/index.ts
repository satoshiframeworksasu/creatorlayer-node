export { Creatorlayer } from "./Creatorlayer.js";
export type { CreatorlayerOptions } from "./types.js";

// Resources (for advanced use / type augmentation)
export { Verifications } from "./resources/Verifications.js";
export { Benchmarks } from "./resources/Benchmarks.js";
export { Webhooks } from "./resources/Webhooks.js";
export { GDPR } from "./resources/GDPR.js";
export { Dashboard } from "./resources/Dashboard.js";
export { Usage } from "./resources/Usage.js";
export { EconomyIndex } from "./resources/EconomyIndex.js";
export { Intelligence } from "./resources/Intelligence.js";
export { Securitization } from "./resources/Securitization.js";

// Errors
export {
  CreatorlayerError,
  CreatorlayerAuthError,
  CreatorlayerForbiddenError,
  CreatorlayerNotFoundError,
  CreatorlayerValidationError,
  CreatorlayerDuplicateError,
  CreatorlayerRateLimitError,
  CreatorlayerServerError,
  CreatorlayerWebhookSignatureError,
} from "./errors.js";

// Types
export type {
  Platform,
  ProductType,
  VerificationStatus,
  RiskTier,
  NDCode,
  WebhookEventType,
  CreateVerificationParams,
  VerificationCreated,
  VerificationStatus_ as VerificationStatusResponse,
  RiskTape,
  BenchmarkMetric,
  Benchmarks as BenchmarksResponse,
  CreateWebhookParams,
  Webhook,
  WebhookEventPayload,
  GDPRLookup,
  GDPRAccessResponse,
  GDPREraseResponse,
  GDPRExportResponse,
  // Dashboard
  DashboardVerificationStatus,
  DashboardVerificationSummary,
  DashboardStats,
  PipelineView,
  VerificationDetail,
  ListVerificationsParams,
  // Usage
  UsageSummary,
  UsageDayEntry,
  UsageHistory,
  // Economy Index
  IndexComponent,
  CreatorIndex,
  IndexHistoryResponse,
  IndexComponentsResponse,
  // Intelligence
  ReportPeriod,
  ReportFilters,
  MarketReportSummary,
  TopVertical,
  SegmentAnalysis,
  TrendPoint,
  TrendData,
  MarketReport,
  ListReportsResponse,
  GenerateReportParams,
  // Securitization
  PoolCriteria,
  SecuritizationPool,
  DataQualityDistribution,
  PoolComposition,
  PoolDetail,
  LoanLevelEntry,
  LoanLevelResponse,
  EsmaPoolReport,
  CreatePoolParams,
  AddToPoolParams,
} from "./types.js";
