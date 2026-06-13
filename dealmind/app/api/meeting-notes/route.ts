// Inbound webhook for AI note-taking apps (Granola, Otter.ai, Fireflies.ai).
//
// DISABLED — "Coming Soon". The previous implementation authenticated by treating
// the user's Supabase UUID as a bearer token, which is not a secret. Until a
// proper per-user webhook secret (rotatable token) + rate limiting is built, this
// endpoint is turned off so it can't be used as an unauthenticated write vector.
// The Granola/Otter/Fireflies connector cards are marked "Coming Soon" in the UI.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { error: 'Meeting-notes connectors are coming soon and not yet available.' },
    { status: 503 }
  );
}
