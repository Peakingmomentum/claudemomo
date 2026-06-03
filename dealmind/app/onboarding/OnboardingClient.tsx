'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Progress } from '@/components/Progress';
import { PillSelect } from '@/components/PillSelect';
import { VoiceField } from '@/components/VoiceField';
import { DropZone } from '@/components/DropZone';
import { AIAvatar } from '@/components/AIAvatar';
import { Icon } from '@/components/Icon';
import type { FlagType } from '@/types';

const TOTAL_STEPS = 8;

interface Profile {
  user_name?: string | null;
  role?: string | null;
  copilot_name?: string | null;
  market_type?: string | null;
  city?: string | null;
  stage?: string | null;
  lead_count?: string | null;
  crm?: string | null;
  crm_usage?: string | null;
  tools?: string[] | null;
  lead_tools?: string[] | null;
  website_url?: string | null;
  no_website?: boolean | null;
  tone_description?: string | null;
  onboarding_step?: number | null;
  onboarding_complete?: boolean | null;
}

export default function OnboardingClient({ initialProfile }: { initialProfile: Profile | null }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [step, setStep] = useState(Math.max(1, initialProfile?.onboarding_step || 1));
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Profile>({
    user_name:        initialProfile?.user_name        ?? '',
    role:             initialProfile?.role             ?? '',
    copilot_name:     initialProfile?.copilot_name     ?? '',
    market_type:      initialProfile?.market_type      ?? '',
    city:             initialProfile?.city             ?? '',
    stage:            initialProfile?.stage            ?? '',
    lead_count:       initialProfile?.lead_count       ?? '',
    crm:              initialProfile?.crm              ?? '',
    crm_usage:        initialProfile?.crm_usage        ?? '',
    tools:            initialProfile?.tools            ?? [],
    lead_tools:       initialProfile?.lead_tools       ?? [],
    website_url:      initialProfile?.website_url      ?? '',
    no_website:       initialProfile?.no_website       ?? false,
    tone_description: initialProfile?.tone_description ?? ''
  });

  const update = (patch: Partial<Profile>) => setForm(f => ({ ...f, ...patch }));

  async function persist(patch: Partial<Profile>, nextStep?: number) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { ...patch, onboarding_step: nextStep ?? step };
    await supabase.from('users').update(payload).eq('id', user.id);
    setSaving(false);
  }

  async function fireFlag(type: FlagType, context?: Record<string, unknown>) {
    try {
      await fetch('/api/flag-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context })
      });
    } catch {
      // Non-blocking
    }
  }

  async function next() {
    await persist(form, step + 1);

    // Internal flag triggers between steps
    if (step === 5 && form.crm === 'none')               await fireFlag('NO_CRM');
    if (step === 5 && form.crm_usage === 'barely')       await fireFlag('CRM_NOT_USED');
    if (step === 7 && form.no_website)                   await fireFlag('NO_WEBSITE');
    if (step === 4 && form.lead_count === '50+')         await fireFlag('HIGH_LEAD_COUNT');

    if (step >= TOTAL_STEPS) {
      await persist({ ...form, onboarding_complete: true } as any, TOTAL_STEPS);
      router.push('/checkout');
      return;
    }
    setStep(s => s + 1);
  }

  async function back() {
    if (step <= 1) return;
    await persist(form, step - 1);
    setStep(s => s - 1);
  }

  const copilotName = form.copilot_name || 'your Copilot';

  return (
    <main style={{ minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Progress current={step} total={TOTAL_STEPS} />
        </div>

        <div className="card">
          {step === 1 && (
            <Step title="Welcome to Pocket Pilot." subtitle="Let's start with your name.">
              <input
                placeholder="Your first name"
                value={form.user_name || ''}
                onChange={e => update({ user_name: e.target.value })}
                style={{ width: '100%' }}
              />
              <PillSelect
                options={[
                  { value: 'investor',   label: 'Real estate investor' },
                  { value: 'agent',      label: 'Real estate agent' },
                  { value: 'both',       label: 'Both' },
                  { value: 'brokerage',  label: 'Brokerage / team' }
                ]}
                value={form.role || ''}
                onChange={(v) => update({ role: v })}
              />
            </Step>
          )}

          {step === 2 && (
            <Step
              title="Name your Copilot."
              subtitle="Pick a name. You'll be working with them every day."
            >
              <AIAvatar name={copilotName} active />
              <input
                placeholder="e.g. Maverick, Athena, Jarvis"
                value={form.copilot_name || ''}
                onChange={e => update({ copilot_name: e.target.value })}
              />
            </Step>
          )}

          {step === 3 && (
            <Step
              title={`${form.user_name || 'OK'} — where do you work?`}
              subtitle="Your market matters. We tune everything to it."
            >
              <PillSelect
                options={[
                  { value: 'urban',     label: 'Urban' },
                  { value: 'suburban',  label: 'Suburban' },
                  { value: 'rural',     label: 'Rural' },
                  { value: 'mixed',     label: 'Mixed' }
                ]}
                value={form.market_type || ''}
                onChange={(v) => update({ market_type: v })}
              />
              <input
                placeholder="City, State (e.g. Austin, TX)"
                value={form.city || ''}
                onChange={e => update({ city: e.target.value })}
              />
            </Step>
          )}

          {step === 4 && (
            <Step title="Where are you in your business?" subtitle="Be honest. It's only the start.">
              <PillSelect
                options={[
                  { value: 'starting', label: 'Just starting out' },
                  { value: 'active',   label: 'Actively closing deals' },
                  { value: 'scaling',  label: 'Scaling to a real business' },
                  { value: 'team',     label: 'Running a team / brokerage' }
                ]}
                value={form.stage || ''}
                onChange={(v) => update({ stage: v })}
              />
              <PillSelect
                options={[
                  { value: '0-5',   label: '0–5 leads' },
                  { value: '6-25',  label: '6–25' },
                  { value: '26-50', label: '26–50' },
                  { value: '50+',   label: '50+' }
                ]}
                value={form.lead_count || ''}
                onChange={(v) => update({ lead_count: v })}
              />
            </Step>
          )}

          {step === 5 && (
            <Step title="What's your CRM?" subtitle={`So ${copilotName} can plug in.`}>
              <PillSelect
                options={[
                  { value: 'ghl',        label: 'GoHighLevel' },
                  { value: 'hubspot',    label: 'HubSpot' },
                  { value: 'salesforce', label: 'Salesforce' },
                  { value: 'podio',      label: 'Podio' },
                  { value: 'none',       label: "I don't have one" },
                  { value: 'other',      label: 'Other' }
                ]}
                value={form.crm || ''}
                onChange={(v) => update({ crm: v })}
              />
              {form.crm && form.crm !== 'none' && (
                <PillSelect
                  options={[
                    { value: 'daily',     label: 'I live in it' },
                    { value: 'sometimes', label: 'I check sometimes' },
                    { value: 'barely',    label: 'I barely use it' }
                  ]}
                  value={form.crm_usage || ''}
                  onChange={(v) => update({ crm_usage: v })}
                />
              )}
            </Step>
          )}

          {step === 6 && (
            <Step title="Which tools do you use?" subtitle="We'll connect what we can.">
              <PillSelect
                multi
                options={[
                  { value: 'Gmail',           label: 'Gmail' },
                  { value: 'Google Calendar', label: 'Google Calendar' },
                  { value: 'Outlook',         label: 'Outlook' },
                  { value: 'Slack',           label: 'Slack' },
                  { value: 'Zoom',            label: 'Zoom' },
                  { value: 'DocuSign',        label: 'DocuSign' },
                  { value: 'Dotloop',         label: 'Dotloop' }
                ]}
                value={form.tools || []}
                onChange={(v) => update({ tools: v })}
              />
              <PillSelect
                multi
                options={[
                  { value: 'Zillow',     label: 'Zillow leads' },
                  { value: 'Realtor',    label: 'Realtor.com' },
                  { value: 'Facebook',   label: 'Facebook ads' },
                  { value: 'Cold call',  label: 'Cold calling' },
                  { value: 'Referrals',  label: 'Referrals' },
                  { value: 'SEO',        label: 'SEO / website' }
                ]}
                value={form.lead_tools || []}
                onChange={(v) => update({ lead_tools: v })}
              />
            </Step>
          )}

          {step === 7 && (
            <Step title="Got a website?" subtitle={`So ${copilotName} can match your tone.`}>
              {!form.no_website && (
                <input
                  placeholder="https://yoursite.com"
                  value={form.website_url || ''}
                  onChange={e => update({ website_url: e.target.value })}
                />
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
                <input
                  type="checkbox"
                  checked={!!form.no_website}
                  onChange={e => update({ no_website: e.target.checked, website_url: '' })}
                  style={{ width: 18, height: 18 }}
                />
                I don't have a website yet
              </label>
              <div style={{ marginTop: 8 }}>
                <DropZone fileType="brand_asset" label="Optional: drop brand assets / examples" />
              </div>
            </Step>
          )}

          {step === 8 && (
            <Step title="Describe your tone." subtitle="How do you sound when you talk to leads?">
              <VoiceField
                value={form.tone_description || ''}
                onChange={(v) => update({ tone_description: v })}
                placeholder="e.g. Warm but direct. Plain English. Never pushy."
                multiline
              />
              <DropZone fileType="tone_sample" label="Optional: drop sample emails or call recordings" />
            </Step>
          )}

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 32, gap: 12
          }}>
            <button className="btn btn-ghost" onClick={back} disabled={step <= 1 || saving}>
              <Icon name="chevron-left" /> Back
            </button>
            <button className="btn" onClick={next} disabled={saving}>
              {step >= TOTAL_STEPS ? 'Finish & continue' : 'Next'} <Icon name="chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <>
      <h2 style={{ fontSize: 24, marginBottom: 8 }}>{title}</h2>
      {subtitle && <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{subtitle}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </>
  );
}
