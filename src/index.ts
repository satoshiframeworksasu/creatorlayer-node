export { Creatorlayer } from "./Creatorlayer.js";
export type { CreatorlayerOptions } from "./types.js";

// Resources (for advanced use / type augmentation)
export { Verifications } from "./resources/Verifications.js";
export { ConsentSessions } from "./resources/ConsentSessions.js";
export { Benchmarks } from "./resources/Benchmarks.js";
export { Webhooks } from "./resources/Webhooks.js";
export { GDPR } from "./resources/GDPR.js";
export type {
  GDPRWithdrawConsentParams, GDPRWithdrawConsentResponse,
  GDPRWithdrawalRequestParams, GDPRWithdrawalRequestResponse,
  GDPRWithdrawalConfirmParams, GDPRWithdrawalConfirmResponse,
} from "./resources/GDPR.js";
export { Dashboard } from "./resources/Dashboard.js";
export { Usage } from "./resources/Usage.js";
export { EconomyIndex } from "./resources/EconomyIndex.js";
// Intelligence class intentionally not exported — pending post-pilot legal analysis
// (Deshoulières Avocats, Jun 2026). Re-enable after clearance.
// Securitization intentionally not exported — product stage 3, pending loan outcomes
// track record (mirrors Intelligence gate). Re-enable after FEATURE_SECURITIZATION_ENABLED
// is activated in production.
export { RiskTapes } from "./resources/RiskTapes.js";
export { DataRoom } from "./resources/DataRoom.js";
export type { DataRoomGateParams, DataRoomGateResponse, DataRoomDocument } from "./resources/DataRoom.js";
export { Pools } from "./resources/Pools.js";
export type { Pool, PoolsListResponse, PoolsReportResponse, PoolDimensionResponse, StratificationDimension } from "./resources/Pools.js";
export { LenderThresholdsResource } from "./resources/LenderThresholds.js";
export type { LenderThresholds, LenderThresholdsResponse, LenderThresholdHistoryEntry, LenderThresholdHistoryResponse } from "./types.js";

// MCP server
export { runMcpServer } from "./mcp.js";

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
  AudiencePlatformType,
  ProductType,
  VerificationStatus,
  RiskTier,
  NDCode,
  WebhookEventType,
  CreateVerificationParams,
  VerificationCreated,
  VerificationStatus_ as VerificationStatusResponse,
  RiskTape,
  AudienceConnection,
  EligibilityResult,
  Covenant,
  TapeResponse,
  StalePlatform,
  EligibilityCheck,
  MonitoredTapeRow,
  MonitoredVerificationsResponse,
  EnrollMonitoringParams,
  EnrollMonitoringResponse,
  UnenrollMonitoringResponse,
  TapeVerifyResult,
  JwksResponse,
  CreateConsentSessionParams,
  ConsentSessionCreated,
  ConsentSessionStatus,
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
