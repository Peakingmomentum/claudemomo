// /ref/[code] — Referral attribution landing page.
// Sets a cookie with the referral code, then redirects to the signup page.
// The signup/auth callback reads this cookie to attribute the referral.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface Props {
  params: { code: string };
}

export default async function RefPage({ params }: Props) {
  const { code } = params;

  // Validate the referral code exists
  const supabase = createSupabaseServerClient();
  const { data: referrer } = await supabase
    .from('users')
    .select('id, user_name')
    .eq('referral_code', code.toUpperCase())
    .maybeSingle();

  if (referrer) {
    // Set a 30-day cookie so signup can read it
    const cookieStore = cookies();
    cookieStore.set('pp_ref', code.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    });
  }

  // Always redirect to home/signup regardless of validity
  redirect('/?ref=' + encodeURIComponent(code.toUpperCase()));
}
