import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RolePickerClient from './RolePickerClient';

export default async function RolePickerPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('users')
    .select('user_role, user_name')
    .eq('id', user.id)
    .maybeSingle();

  // If role already set, go to dashboard
  if (profile?.user_role) redirect('/dashboard');

  return <RolePickerClient userName={profile?.user_name || null} />;
}
