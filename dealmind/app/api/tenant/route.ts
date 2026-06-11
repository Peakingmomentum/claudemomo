import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET /api/tenant?domain=customdomain.com
// Returns brand config if domain matches a tenant, else null.
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain');
  if (!domain) return NextResponse.json(null);

  const supabase = createSupabaseServerClient();
  const { data: tenant } = await supabase
    .from('tenant_brands')
    .select('id, brand_name, logo_url, primary_color, custom_domain')
    .eq('custom_domain', domain.toLowerCase())
    .maybeSingle();

  return NextResponse.json(tenant || null);
}

// POST /api/tenant — create or update tenant brand config
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = await req.json() as {
    brand_name?: string;
    logo_url?: string;
    primary_color?: string;
    custom_domain?: string;
  };

  // Upsert tenant brand for this user
  const { data, error } = await supabase
    .from('tenant_brands')
    .upsert({
      owner_user_id: user.id,
      brand_name:    body.brand_name    || 'Pocket Pilot',
      logo_url:      body.logo_url      || null,
      primary_color: body.primary_color || '#0f4c81',
      custom_domain: body.custom_domain ? body.custom_domain.toLowerCase().trim() : null,
    }, { onConflict: 'owner_user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, tenant: data });
}

// PUT /api/tenant/invite — invite a team member (POST body: { email })
// Simplified for now — just records the invite_email
export async function PUT(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { email } = await req.json() as { email: string };
  if (!email?.includes('@')) return NextResponse.json({ error: 'invalid email' }, { status: 400 });

  // Find tenant for this user
  const { data: tenant } = await supabase
    .from('tenant_brands')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (!tenant) return NextResponse.json({ error: 'no tenant found — create brand config first' }, { status: 400 });

  // Check if invitee already has an account
  const { data: invitee } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  // Insert member record (with or without a user_id)
  const { error } = await supabase.from('tenant_members').upsert({
    tenant_id:    tenant.id,
    user_id:      invitee?.id || null,
    invite_email: email.toLowerCase().trim(),
    role:         'member',
    joined_at:    invitee ? new Date().toISOString() : null,
  }, { onConflict: 'tenant_id,user_id' });

  if (error && !error.message.includes('null')) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, joined: !!invitee });
}
