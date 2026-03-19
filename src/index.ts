export { Creatorlayer } from "./Creatorlayer.js";
export type { CreatorlayerOptions } from "./types.js";

// Resources (for advanced use / type augmentation)
export { Verifications } from "./resources/Verifications.js";
export { Benchmarks } from "./resources/Benchmarks.js";
export { Webhooks } from "./resources/Webhooks.js";
export { GDPR } from "./resources/GDPR.js";

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
} from "./types.js";
