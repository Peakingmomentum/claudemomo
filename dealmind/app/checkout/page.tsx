import CheckoutClient from './CheckoutClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function CheckoutPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('users')
    .select('copilot_name, user_name')
    .eq('id', user.id)
    .maybeSingle();

  return <CheckoutClient copilotName={profile?.copilot_name} userName={profile?.user_name} />;
}
