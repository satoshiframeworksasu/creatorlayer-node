export class CreatorlayerError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "CreatorlayerError";
    this.status = status;
    this.code = code;
  }
}

export class CreatorlayerAuthError extends CreatorlayerError {
  constructor(message = "Missing or invalid API key") {
    super(message, 401, "unauthorized");
    this.name = "CreatorlayerAuthError";
  }
}

export class CreatorlayerForbiddenError extends CreatorlayerError {
  constructor(message = "Insufficient role for this endpoint") {
    super(message, 403, "forbidden");
    this.name = "CreatorlayerForbiddenError";
  }
}

export class CreatorlayerNotFoundError extends CreatorlayerError {
  constructor(message = "Resource not found") {
    super(message, 404, "not_found");
    this.name = "CreatorlayerNotFoundError";
  }
}

export class CreatorlayerValidationError extends CreatorlayerError {
  constructor(message: string, code = "validation_error") {
    super(message, 400, code);
    this.name = "CreatorlayerValidationError";
  }
}

export class CreatorlayerDuplicateError extends CreatorlayerError {
  constructor(message = "Idempotency-Key already used with a different payload") {
    super(message, 409, "duplicate_request");
    this.name = "CreatorlayerDuplicateError";
  }
}

export class CreatorlayerRateLimitError extends CreatorlayerError {
  /** Seconds to wait before retrying, from the Retry-After header. */
  readonly retryAfter: number;

  constructor(message = "Too many requests", retryAfter = 60) {
    super(message, 429, "rate_limited");
    this.name = "CreatorlayerRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class CreatorlayerServerError extends CreatorlayerError {
  constructor(message = "Internal server error", status = 500) {
    super(message, status, status === 503 ? "service_unavailable" : "internal_error");
    this.name = "CreatorlayerServerError";
  }
}

export class CreatorlayerWebhookSignatureError extends Error {
  constructor(message = "Webhook signature verification failed") {
    super(message);
    this.name = "CreatorlayerWebhookSignatureError";
  }
}
