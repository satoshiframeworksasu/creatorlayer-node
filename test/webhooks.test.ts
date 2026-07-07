/// <reference types="jest" />

import { createHmac } from 'crypto';
import { Creatorlayer } from '../src/Creatorlayer';
import { CreatorlayerWebhookSignatureError } from '../src/errors';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SECRET = 'whsec_test_secret_key_for_unit_tests';
const PAYLOAD = JSON.stringify({
  event: 'verification.completed',
  verification_id: 'ver_123',
});

function sign(body: string | Buffer, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

// Shared client instance — webhooks module makes no HTTP calls in these tests
const cl = new Creatorlayer({ apiKey: 'cl_test_key_for_webhooks' });

// ---------------------------------------------------------------------------
// verifyAndParse
// ---------------------------------------------------------------------------

describe('Webhooks.verifyAndParse', () => {
  test('valid string body + valid signature → returns parsed object with event field', () => {
    const sig = sign(PAYLOAD, SECRET);
    const result = cl.webhooks.verifyAndParse(PAYLOAD, sig, SECRET);
    expect(result).toBeDefined();
    expect(result.event).toBe('verification.completed');
  });

  test('valid Buffer body + valid signature → returns parsed object', () => {
    const buf = Buffer.from(PAYLOAD);
    const sig = sign(buf, SECRET);
    const result = cl.webhooks.verifyAndParse(buf, sig, SECRET);
    expect(result).toBeDefined();
    expect(result.event).toBe('verification.completed');
  });

  test('wrong signature → throws CreatorlayerWebhookSignatureError', () => {
    expect(() =>
      cl.webhooks.verifyAndParse(PAYLOAD, 'deadbeefdeadbeef', SECRET),
    ).toThrow(CreatorlayerWebhookSignatureError);
  });

  test('tampered body → throws CreatorlayerWebhookSignatureError', () => {
    const sig = sign(PAYLOAD, SECRET);
    const tampered = PAYLOAD.replace('ver_123', 'ver_EVIL');
    expect(() =>
      cl.webhooks.verifyAndParse(tampered, sig, SECRET),
    ).toThrow(CreatorlayerWebhookSignatureError);
  });

  test('no timestamp option → signature-only check, passes even with old timestamp in payload', () => {
    // No options.timestamp → replay protection is skipped entirely
    const sig = sign(PAYLOAD, SECRET);
    expect(() =>
      cl.webhooks.verifyAndParse(PAYLOAD, sig, SECRET, undefined),
    ).not.toThrow();
  });

  test('valid timestamp within 5 minutes → passes', () => {
    const ts = Math.floor(Date.now() / 1000) - 60; // 60 s ago — well within 300 s tolerance
    const sig = sign(PAYLOAD, SECRET);
    const result = cl.webhooks.verifyAndParse(PAYLOAD, sig, SECRET, {
      timestamp: String(ts),
    });
    expect(result.event).toBe('verification.completed');
  });

  test('expired timestamp (>5 min ago) → throws CreatorlayerWebhookSignatureError', () => {
    const ts = Math.floor(Date.now() / 1000) - 400; // 400 s ago > 300 s tolerance
    const sig = sign(PAYLOAD, SECRET);
    expect(() =>
      cl.webhooks.verifyAndParse(PAYLOAD, sig, SECRET, { timestamp: String(ts) }),
    ).toThrow(CreatorlayerWebhookSignatureError);
  });

  test('far-future timestamp (>60 s ahead) → throws CreatorlayerWebhookSignatureError', () => {
    const ts = Math.floor(Date.now() / 1000) + 120; // 120 s in the future > −60 s boundary
    const sig = sign(PAYLOAD, SECRET);
    expect(() =>
      cl.webhooks.verifyAndParse(PAYLOAD, sig, SECRET, { timestamp: String(ts) }),
    ).toThrow(CreatorlayerWebhookSignatureError);
  });

  test('custom toleranceSeconds: 600 → accepts timestamp 480 s old (normally rejected)', () => {
    const ts = Math.floor(Date.now() / 1000) - 480; // 480 s ago > default 300, but < 600
    const sig = sign(PAYLOAD, SECRET);
    const result = cl.webhooks.verifyAndParse(PAYLOAD, sig, SECRET, {
      timestamp: String(ts),
      toleranceSeconds: 600,
    });
    expect(result.event).toBe('verification.completed');
  });

  test('invalid timestamp string (NaN) → throws CreatorlayerWebhookSignatureError', () => {
    const sig = sign(PAYLOAD, SECRET);
    expect(() =>
      cl.webhooks.verifyAndParse(PAYLOAD, sig, SECRET, { timestamp: 'not-a-number' }),
    ).toThrow(CreatorlayerWebhookSignatureError);
  });
});

// ---------------------------------------------------------------------------
// verifySignature
// ---------------------------------------------------------------------------

describe('Webhooks.verifySignature', () => {
  test('valid signature → returns true', () => {
    const sig = sign(PAYLOAD, SECRET);
    expect(cl.webhooks.verifySignature(PAYLOAD, sig, SECRET)).toBe(true);
  });

  test('invalid signature → returns false (does not throw)', () => {
    expect(
      cl.webhooks.verifySignature(PAYLOAD, 'badbadbadbad', SECRET),
    ).toBe(false);
  });
});
