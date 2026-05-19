import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SignInClient from './SignInClient';

export default async function LandingPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status, onboarding_complete')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.subscription_status === 'active' && profile.onboarding_complete) {
      redirect('/dashboard');
    }
    if (profile?.onboarding_complete) {
      redirect('/checkout');
    }
    redirect('/onboarding');
  }

  return <SignInClient />;
}
