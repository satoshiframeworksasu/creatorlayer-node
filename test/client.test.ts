/// <reference types="jest" />

import { Creatorlayer } from '../src/Creatorlayer';
import {
  CreatorlayerError,
  CreatorlayerAuthError,
  CreatorlayerForbiddenError,
  CreatorlayerNotFoundError,
  CreatorlayerValidationError,
  CreatorlayerDuplicateError,
  CreatorlayerRateLimitError,
  CreatorlayerServerError,
} from '../src/errors';

// ---------------------------------------------------------------------------
// Shared mock helper
// ---------------------------------------------------------------------------

function mockFetch(
  status: number,
  body: unknown = {},
  headers: Record<string, string> = {},
) {
  return jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    json: async () => body,
    arrayBuffer: async () => new ArrayBuffer(8),
  } as unknown as Response);
}

// Restore all spies after every test.
afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('Constructor', () => {
  test('throws synchronously if apiKey is empty string', () => {
    expect(() => new Creatorlayer({ apiKey: '' })).toThrow('apiKey is required');
  });

  test('throws synchronously if apiKey is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => new Creatorlayer({ apiKey: undefined as any })).toThrow('apiKey is required');
  });

  test('uses production URL https://api.creatorlayer.eu by default', async () => {
    const spy = mockFetch(200, {});
    const client = new Creatorlayer({ apiKey: 'test_key' });
    await client._request('GET', '/api/v1/test');
    expect(spy.mock.calls[0][0]).toContain('https://api.creatorlayer.eu');
  });

  test('uses sandbox URL https://api-sandbox.creatorlayer.eu when sandbox: true', async () => {
    const spy = mockFetch(200, {});
    const client = new Creatorlayer({ apiKey: 'test_key', sandbox: true });
    await client._request('GET', '/api/v1/test');
    expect(spy.mock.calls[0][0]).toContain('https://api-sandbox.creatorlayer.eu');
  });

  test('uses custom baseUrl when provided (overrides sandbox)', async () => {
    const spy = mockFetch(200, {});
    const client = new Creatorlayer({
      apiKey: 'test_key',
      baseUrl: 'https://custom.example.com',
      sandbox: true,
    });
    await client._request('GET', '/api/v1/test');
    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain('https://custom.example.com');
    expect(url).not.toContain('sandbox');
  });

  test('instantiates all 12 resource namespaces', () => {
    const client = new Creatorlayer({ apiKey: 'test_key' });
    expect(client.verifications).toBeDefined();
    expect(client.consentSessions).toBeDefined();
    expect(client.riskTapes).toBeDefined();
    expect(client.benchmarks).toBeDefined();
    expect(client.webhooks).toBeDefined();
    expect(client.gdpr).toBeDefined();
    expect(client.dashboard).toBeDefined();
    expect(client.usage).toBeDefined();
    expect(client.economyIndex).toBeDefined();
    expect(client.securitization).toBeDefined();
    expect(client.dataRoom).toBeDefined();
    expect(client.pools).toBeDefined();
  });

  test('generateIdempotencyKey returns a UUID v4 string', () => {
    const key = Creatorlayer.generateIdempotencyKey();
    expect(typeof key).toBe('string');
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test('generateIdempotencyKey generates unique values', () => {
    const key1 = Creatorlayer.generateIdempotencyKey();
    const key2 = Creatorlayer.generateIdempotencyKey();
    expect(key1).not.toBe(key2);
  });
});

// ---------------------------------------------------------------------------
// _request — happy path
// ---------------------------------------------------------------------------

describe('_request — happy path', () => {
  let client: Creatorlayer;

  beforeEach(() => {
    client = new Creatorlayer({ apiKey: 'cl_test_key_123' });
  });

  test('sends Authorization: Bearer <key> header', async () => {
    const spy = mockFetch(200, {});
    await client._request('GET', '/api/v1/test');
    const headers = spy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer cl_test_key_123');
  });

  test('sends Content-Type: application/json header', async () => {
    const spy = mockFetch(200, {});
    await client._request('GET', '/api/v1/test');
    const headers = spy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  test('appends query params to URL', async () => {
    const spy = mockFetch(200, {});
    await client._request('GET', '/api/v1/test', { query: { page: '2', limit: '10' } });
    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
  });

  test('serialises body option as JSON string', async () => {
    const spy = mockFetch(200, {});
    const body = { name: 'test', value: 42 };
    await client._request('POST', '/api/v1/test', { body });
    const fetchBody = spy.mock.calls[0][1]?.body as string;
    expect(fetchBody).toBe(JSON.stringify(body));
  });

  test('returns parsed JSON from response.json()', async () => {
    const expected = { id: 'ver_123', status: 'pending' };
    mockFetch(200, expected);
    const result = await client._request<typeof expected>('GET', '/api/v1/test');
    expect(result).toEqual(expected);
  });

  test('returns undefined for 204 No Content', async () => {
    mockFetch(204, undefined);
    const result = await client._request('DELETE', '/api/v1/test');
    expect(result).toBeUndefined();
  });

  test('retry: false skips auto-retry on 429', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: '429',
      headers: { get: (k: string) => (k.toLowerCase() === 'retry-after' ? '5' : null) },
      json: async () => ({ message: 'Too many requests' }),
      arrayBuffer: async () => new ArrayBuffer(8),
    } as unknown as Response);

    await expect(
      client._request('GET', '/api/v1/test', { retry: false }),
    ).rejects.toBeInstanceOf(CreatorlayerRateLimitError);

    // Exactly one call — no retry attempted
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

describe('Error mapping', () => {
  let client: Creatorlayer;

  beforeEach(() => {
    client = new Creatorlayer({ apiKey: 'cl_test_key' });
  });

  test('400 → CreatorlayerValidationError, status === 400', async () => {
    mockFetch(400, { message: 'Bad request' });
    const err = await client._request('GET', '/test').catch((e) => e) as CreatorlayerError;
    expect(err).toBeInstanceOf(CreatorlayerValidationError);
    expect(err.status).toBe(400);
  });

  test('401 → CreatorlayerAuthError, status === 401', async () => {
    mockFetch(401, { message: 'Unauthorized' });
    const err = await client._request('GET', '/test').catch((e) => e) as CreatorlayerError;
    expect(err).toBeInstanceOf(CreatorlayerAuthError);
    expect(err.status).toBe(401);
  });

  test('403 → CreatorlayerForbiddenError, status === 403', async () => {
    mockFetch(403, { message: 'Forbidden' });
    const err = await client._request('GET', '/test').catch((e) => e) as CreatorlayerError;
    expect(err).toBeInstanceOf(CreatorlayerForbiddenError);
    expect(err.status).toBe(403);
  });

  test('404 → CreatorlayerNotFoundError, status === 404', async () => {
    mockFetch(404, { message: 'Not found' });
    const err = await client._request('GET', '/test').catch((e) => e) as CreatorlayerError;
    expect(err).toBeInstanceOf(CreatorlayerNotFoundError);
    expect(err.status).toBe(404);
  });

  test('409 → CreatorlayerDuplicateError, status === 409', async () => {
    mockFetch(409, { message: 'Conflict' });
    const err = await client._request('GET', '/test').catch((e) => e) as CreatorlayerError;
    expect(err).toBeInstanceOf(CreatorlayerDuplicateError);
    expect(err.status).toBe(409);
  });

  test('429 → CreatorlayerRateLimitError, status === 429, retryAfter === 30', async () => {
    // Use maxRetries: 0 so the error is thrown immediately without retry
    const client429 = new Creatorlayer({ apiKey: 'cl_test_key', maxRetries: 0 });
    mockFetch(429, { message: 'Rate limited' }, { 'retry-after': '30' });
    const err = await client429._request('GET', '/test').catch((e) => e) as CreatorlayerRateLimitError;
    expect(err).toBeInstanceOf(CreatorlayerRateLimitError);
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(30);
  });

  test('500 → CreatorlayerServerError, status === 500', async () => {
    mockFetch(500, { message: 'Internal server error' });
    const err = await client._request('GET', '/test').catch((e) => e) as CreatorlayerError;
    expect(err).toBeInstanceOf(CreatorlayerServerError);
    expect(err.status).toBe(500);
  });

  test('503 → CreatorlayerServerError, status === 503 (maxRetries: 0)', async () => {
    const client503 = new Creatorlayer({ apiKey: 'cl_test_key', maxRetries: 0 });
    mockFetch(503, { message: 'Service unavailable' });
    const err = await client503._request('GET', '/test').catch((e) => e) as CreatorlayerError;
    expect(err).toBeInstanceOf(CreatorlayerServerError);
    expect(err.status).toBe(503);
  });
});

// ---------------------------------------------------------------------------
// Retry logic
// ---------------------------------------------------------------------------

describe('Retry logic', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('429 retry: retries once after Retry-After delay, returns 200 body', async () => {
    jest.useFakeTimers();

    const body200 = { id: 'ver_abc', status: 'completed' };
    const spy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: '429',
        headers: { get: (k: string) => (k.toLowerCase() === 'retry-after' ? '1' : null) },
        json: async () => ({ message: 'Rate limited' }),
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: '200',
        headers: { get: () => null },
        json: async () => body200,
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response);

    const client = new Creatorlayer({ apiKey: 'cl_test', maxRetries: 1 });
    const promise = client._request<typeof body200>('GET', '/api/v1/test');

    // Retry-After is 1 second → sleep(1000 ms)
    await jest.advanceTimersByTimeAsync(1100);
    const result = await promise;

    expect(spy).toHaveBeenCalledTimes(2);
    expect(result).toEqual(body200);
  });

  test('503 retry: retries once after exponential backoff (1000 ms), returns 200 body', async () => {
    jest.useFakeTimers();

    const body200 = { status: 'ok' };
    const spy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: '503',
        headers: { get: () => null },
        json: async () => ({ message: 'Service unavailable' }),
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: '200',
        headers: { get: () => null },
        json: async () => body200,
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response);

    const client = new Creatorlayer({ apiKey: 'cl_test', maxRetries: 1 });
    const promise = client._request<typeof body200>('GET', '/api/v1/test');

    // Backoff = 1000 * 2^0 = 1000 ms
    await jest.advanceTimersByTimeAsync(1100);
    const result = await promise;

    expect(spy).toHaveBeenCalledTimes(2);
    expect(result).toEqual(body200);
  });

  test('exhausted retries: throws CreatorlayerRateLimitError after maxRetries attempts', async () => {
    jest.useFakeTimers();

    // Always return 429 with Retry-After: 1
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 429,
      statusText: '429',
      headers: { get: (k: string) => (k.toLowerCase() === 'retry-after' ? '1' : null) },
      json: async () => ({ message: 'Rate limited' }),
      arrayBuffer: async () => new ArrayBuffer(8),
    } as unknown as Response);

    // maxRetries: 2 → 3 total calls (attempt 0, 1, 2), then throws
    const client = new Creatorlayer({ apiKey: 'cl_test', maxRetries: 2 });
    const promise = client._request('GET', '/api/v1/test');

    // Attach the rejection assertion BEFORE advancing timers so the rejection
    // is never considered "unhandled" by Node.js.
    const assertion = expect(promise).rejects.toBeInstanceOf(CreatorlayerRateLimitError);

    // Two sleeps of 1000 ms each; advance well past both
    await jest.advanceTimersByTimeAsync(10_000);

    await assertion;
  });
});

// ---------------------------------------------------------------------------
// _requestRaw
// ---------------------------------------------------------------------------

describe('_requestRaw', () => {
  test('returns the raw Response object (has arrayBuffer method), not parsed JSON', async () => {
    mockFetch(200, { should_not_be_returned: true });
    const client = new Creatorlayer({ apiKey: 'cl_test' });

    const response = await client._requestRaw('GET', '/test');

    // Must be the Response object, not parsed JSON
    expect(response).toBeDefined();
    expect(typeof response.arrayBuffer).toBe('function');
    // Should NOT have been unwrapped to the body object
    expect((response as unknown as Record<string, unknown>).should_not_be_returned).toBeUndefined();
  });
});
