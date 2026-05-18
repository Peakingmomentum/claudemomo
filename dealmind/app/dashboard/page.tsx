import DashboardClient from './DashboardClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const [{ data: profile }, { data: leads }, { data: messages }, { data: calendar }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('leads').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(50),
    supabase.from('calendar_events').select('*').eq('user_id', user.id).gte('event_date', new Date().toISOString()).order('event_date')
  ]);

  if (!profile) redirect('/onboarding');

  return (
    <DashboardClient
      profile={profile as any}
      initialLeads={(leads || []) as any}
      initialMessages={(messages || []) as any}
      initialCalendar={(calendar || []) as any}
    />
  );
}
