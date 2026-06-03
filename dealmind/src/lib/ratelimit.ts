import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export interface RateLimitRule {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/**
 * Sensible defaults tuned to stop abuse without throttling real usage.
 * Authenticated product actions are generous; the unauthenticated voice
 * endpoint (a direct cost vector) is tighter and keyed by IP.
 */
export const LIMITS = {
  // Core copilot chat — heavy users send many messages a minute; stay generous.
  copilot:     { limit: 40, windowSeconds: 60 } as RateLimitRule,
  // External paid-API calls (skip-trace / enrichment) — moderate.
  enrich:      { limit: 20, windowSeconds: 60 } as RateLimitRule,
  hotLeads:    { limit: 15, windowSeconds: 60 } as RateLimitRule,
  // Unauthenticated voice summariser — keyed by IP, calls Anthropic.
  voice:       { limit: 30, windowSeconds: 60 } as RateLimitRule,
  // Generic authenticated fallback.
  standard:    { limit: 60, windowSeconds: 60 } as RateLimitRule,
};

/**
 * Returns true when the request is allowed. Fails OPEN: if the limiter backend
 * is unreachable or the RPC is missing, we never block a legitimate user.
 */
export async function checkRateLimit(identifier: string, rule: RateLimitRule): Promise<boolean> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key: identifier,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });
    if (error) return true; // fail open
    return data !== false;
  } catch {
    return true; // fail open
  }
}

/** Extract the client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/** Standard 429 response with a Retry-After hint. */
export function rateLimitResponse(rule: RateLimitRule) {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down and try again shortly.' },
    { status: 429, headers: { 'Retry-After': String(rule.windowSeconds) } }
  );
}
