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
    // Most recent 50 chat messages (newest first); reversed below to chronological order
    // so the chat opens on the last entered conversation.
    supabase.from('chat_messages').select('*').eq('user_id', user.id)
      .or('context.is.null,context.eq.chat')
      .order('created_at', { ascending: false }).limit(50),
    // Load ALL events (past, future, completed) so the Tasks view can show history.
    supabase.from('calendar_events').select('*').eq('user_id', user.id).order('event_date')
  ]);

  if (!profile) redirect('/onboarding');

  return (
    <DashboardClient
      profile={profile as any}
      initialLeads={(leads || []) as any}
      initialMessages={((messages || []).slice().reverse()) as any}
      initialCalendar={(calendar || []) as any}
    />
  );
}
