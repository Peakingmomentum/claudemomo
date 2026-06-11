'use client';

import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { DealMindUser } from '@/types';

interface Connector {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'data' | 'automation' | 'notes';
  logoInitial: string;
  logoColor: string;
  type: 'oauth' | 'apikey' | 'webhook' | 'receive' | 'coming_soon' | 'ghl';
  field?: keyof DealMindUser;
  secondField?: keyof DealMindUser;
  oauthUrl?: string;
  connectedField?: keyof DealMindUser;
  docsUrl?: string;
  featured?: boolean;
  upsellUrl?: string;
  badge?: string;
}

const CONNECTORS: Connector[] = [
  // Communication
  {
    id: 'gmail', name: 'Gmail', category: 'communication',
    description: 'Read emails, auto-draft follow-ups, flag motivated sellers.',
    logoInitial: 'G', logoColor: '#EA4335',
    type: 'oauth', connectedField: 'gmail_connected',
    oauthUrl: '/api/gmail-oauth',
  },
  {
    id: 'gcal', name: 'Google Calendar', category: 'communication',
    description: 'Sync appointments, follow-ups, and deal milestones.',
    logoInitial: 'GC', logoColor: '#4285F4',
    type: 'oauth', connectedField: 'gcal_connected',
    oauthUrl: '/api/gmail-oauth?scope=calendar',
  },
  {
    id: 'outlook', name: 'Outlook / Microsoft 365', category: 'communication',
    description: 'Connect your Microsoft email and calendar.',
    logoInitial: 'OL', logoColor: '#0078D4',
    type: 'coming_soon',
  },

  // Data / List Services
  {
    id: 'propstream', name: 'PropStream', category: 'data',
    description: 'Pull absentee, pre-foreclosure, and equity lists directly into the stacker.',
    logoInitial: 'PS', logoColor: '#5A67D8',
    type: 'apikey', field: 'propstream_api_key',
    docsUrl: 'https://api.propstream.com',
  },
  {
    id: 'batchleads', name: 'BatchLeads', category: 'data',
    description: 'Import motivated seller lists and skip-traced contacts automatically.',
    logoInitial: 'BL', logoColor: '#48BB78',
    type: 'apikey', field: 'batchleads_api_key',
    docsUrl: 'https://batchleads.io/api',
  },

  // Automation
  {
    id: 'liststacker', name: 'List Stacker', category: 'automation',
    description: 'Stack absentee, pre-foreclosure, trust deed, and tax deed lists to surface the most motivated sellers by zip code. A standalone app built for serious investors — upload multiple CSV lists and find the highest-overlap leads automatically.',
    logoInitial: 'LS', logoColor: '#4a90d9',
    type: 'coming_soon',
    featured: true, upsellUrl: 'https://liststacker.app',
    badge: 'Standalone App',
  },
  {
    id: 'warmfollow', name: 'WarmFollow CRM', category: 'automation',
    description: 'A done-for-you GoHighLevel CRM built specifically for real estate investors — automated follow-up sequences, pipeline stages, and lead nurturing all pre-configured. Already have WarmFollow? Paste your GHL API key to sync leads instantly.',
    logoInitial: 'WF', logoColor: '#f97316',
    type: 'apikey', field: 'warmfollow_api_key',
    docsUrl: 'https://warmfollow.com',
    featured: true, upsellUrl: 'https://warmfollow.com',
    badge: 'Powered by GoHighLevel',
  },
  {
    id: 'gohighlevel', name: 'GoHighLevel', category: 'automation',
    description: 'Connect your own GHL location so your copilot can text leads and create call/text reminders directly in your CRM. Paste your Private Integration token and Location ID below.',
    logoInitial: 'GHL', logoColor: '#2dd4bf',
    type: 'ghl', field: 'ghl_api_key', secondField: 'ghl_location_id',
    connectedField: 'ghl_connected',
    docsUrl: 'https://help.gohighlevel.com/support/solutions/articles/155000003054-private-integrations',
    badge: 'Agent can text & remind',
  },
  {
    id: 'slack', name: 'Slack', category: 'automation',
    description: 'Post lead updates to your team channel — new leads, stage changes, contact logs, and dead deals. Your whole team stays in sync without leaving Slack.',
    logoInitial: 'Sl', logoColor: '#4A154B',
    type: 'webhook', field: 'slack_webhook_url',
    docsUrl: 'https://api.slack.com/messaging/webhooks',
    badge: 'Team Notifications',
  },
  {
    id: 'zapier', name: 'Zapier', category: 'automation',
    description: 'Trigger Zaps when leads are added, updated, or go cold.',
    logoInitial: 'Z', logoColor: '#FF4A00',
    type: 'webhook', field: 'zapier_webhook_url',
    docsUrl: 'https://zapier.com/apps/webhooks',
  },
  {
    id: 'hotleads', name: 'Hot Leads Generator', category: 'automation',
    description: 'AI-powered motivated seller finder — pulls absentee, pre-foreclosure, and distressed property lists, scores them, and feeds the highest-probability leads directly into your pipeline. A standalone app for serious acquisition teams.',
    logoInitial: 'HL', logoColor: '#ef4444',
    type: 'coming_soon',
    featured: true, upsellUrl: 'https://pocketpilot.app/hot-leads',
    badge: 'Standalone Add-On',
  },

  // AI Meeting Notes
  {
    id: 'granola', name: 'Granola', category: 'notes',
    description: 'AI notepad that enhances your meeting notes. After each call, Granola can auto-post a summary to the matching lead in your pipeline.',
    logoInitial: 'Gr', logoColor: '#16a34a',
    type: 'receive',
    docsUrl: 'https://granola.so',
    badge: 'Meeting Notes',
  },
  {
    id: 'otter', name: 'Otter.ai', category: 'notes',
    description: 'Transcribes calls and meetings in real time. Connect Otter to push meeting summaries directly to your lead notes.',
    logoInitial: 'Ot', logoColor: '#5B4CF5',
    type: 'receive',
    docsUrl: 'https://otter.ai',
    badge: 'Transcription',
  },
  {
    id: 'fireflies', name: 'Fireflies.ai', category: 'notes',
    description: 'Records, transcribes, and summarises your sales calls. Use the webhook to sync call notes into the right lead automatically.',
    logoInitial: 'Ff', logoColor: '#f97316',
    type: 'receive',
    docsUrl: 'https://fireflies.ai',
    badge: 'Call Recording',
  },
];

const CATEGORY_LABELS = { communication: 'Communication', data: 'List & Data Sources', automation: 'Automation & CRM', notes: 'AI Meeting Notes' };

interface Props { profile: DealMindUser; onProfileUpdate: (patch: Partial<DealMindUser>) => void; }

export function Connectors({ profile, onProfileUpdate }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [editing, setEditing]       = useState<string | null>(null);
  const [inputVal, setInputVal]     = useState('');
  const [inputVal2, setInputVal2]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState<string | null>(null);
  const [setupOpen, setSetupOpen]   = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [urlCopied, setUrlCopied]   = useState(false);

  const appUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://your-app.vercel.app';

  function copyToken() {
    navigator.clipboard.writeText(profile.id);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  }

  function copyUrl() {
    navigator.clipboard.writeText(`${appUrl}/api/meeting-notes`);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }

  async function saveKey(connector: Connector) {
    if (!connector.field || !inputVal.trim()) return;
    // GHL needs both an API key and a Location ID; mark connected when both present.
    if (connector.type === 'ghl') {
      if (!connector.secondField || !inputVal2.trim()) return;
      setSaving(true);
      const patch: Record<string, any> = {
        [connector.field]: inputVal.trim(),
        [connector.secondField]: inputVal2.trim(),
        ghl_connected: true,
      };
      const { error } = await supabase.from('users').update(patch).eq('id', profile.id);
      if (!error) {
        onProfileUpdate(patch as any);
        setSaved(connector.id);
        setEditing(null);
        setInputVal2('');
        setTimeout(() => setSaved(null), 3000);
      }
      setSaving(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('users').update({ [connector.field]: inputVal.trim() }).eq('id', profile.id);
    if (!error) {
      onProfileUpdate({ [connector.field]: inputVal.trim() } as any);
      setSaved(connector.id);
      setEditing(null);
      setTimeout(() => setSaved(null), 3000);
    }
    setSaving(false);
  }

  async function disconnect(connector: Connector) {
    if (connector.type === 'ghl') {
      const patch = { ghl_api_key: null, ghl_location_id: null, ghl_connected: false };
      await supabase.from('users').update(patch).eq('id', profile.id);
      onProfileUpdate(patch as any);
      return;
    }
    const field = connector.field || connector.connectedField;
    if (!field) return;
    const val = connector.type === 'oauth' ? false : null;
    await supabase.from('users').update({ [field]: val }).eq('id', profile.id);
    onProfileUpdate({ [field]: val } as any);
  }

  function isConnected(c: Connector): boolean {
    if (c.connectedField) return !!(profile as any)[c.connectedField];
    if (c.field) return !!(profile as any)[c.field];
    return false;
  }

  const categories = ['communication', 'data', 'automation', 'notes'] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>Connectors</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Connect your tools so {profile.copilot_name || 'Pilot'} can pull data, sync leads, and automate outreach.
        </p>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 12 }}>
            {CATEGORY_LABELS[cat]}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CONNECTORS.filter(c => c.category === cat).map(c => {
              const connected = isConnected(c);
              const isEditing = editing === c.id;
              const wasSaved  = saved === c.id;

              return (
                <div key={c.id} className="card" style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  opacity: (c.type === 'coming_soon' && !c.featured) ? 0.6 : 1,
                  borderColor: connected ? '#10b981' : c.featured ? c.logoColor : 'var(--border)',
                  borderWidth: connected || c.featured ? 2 : 1,
                  background: c.featured && !connected
                    ? `linear-gradient(135deg, ${c.logoColor}08, ${c.logoColor}04)`
                    : undefined,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Featured glow strip */}
                  {c.featured && !connected && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: `linear-gradient(90deg, ${c.logoColor}, ${c.logoColor}99)`,
                    }} />
                  )}

                  {/* Logo */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: c.featured ? c.logoColor : `${c.logoColor}18`,
                    border: c.featured ? 'none' : `1px solid ${c.logoColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: c.logoInitial.length > 1 ? 11 : 14, fontWeight: 800,
                    color: c.featured ? '#fff' : c.logoColor, letterSpacing: '-0.02em',
                  }}>{c.logoInitial}</div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                      {c.badge && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: `${c.logoColor}18`, color: c.logoColor, fontWeight: 700, border: `1px solid ${c.logoColor}30` }}>
                          {c.badge}
                        </span>
                      )}
                      {c.type === 'coming_soon' && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'var(--surface)', color: 'var(--muted)', fontWeight: 600 }}>
                          Coming Soon
                        </span>
                      )}
                      {connected && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#10b981', fontWeight: 700 }}>
                          ✓ Connected
                        </span>
                      )}
                      {wasSaved && (
                        <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Saved ✓</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{c.description}</p>

                    {/* Featured upsell CTA */}
                    {c.featured && !connected && !isEditing && c.upsellUrl && (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <a href={c.upsellUrl} target="_blank" rel="noreferrer" style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: c.logoColor, color: '#fff', textDecoration: 'none',
                          boxShadow: `0 2px 8px ${c.logoColor}40`,
                        }}>
                          <Icon name={c.id === 'warmfollow' ? 'flame' : 'link'} size={13} color="#fff" />
                          {c.type === 'coming_soon' ? `Learn about ${c.name}` : `Get ${c.name}`}
                        </a>
                        {c.type !== 'coming_soon' && (
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Already a member? Connect below ↓</span>
                        )}
                      </div>
                    )}

                    {/* Receive-type setup instructions */}
                    {c.type === 'receive' && setupOpen === c.id && (
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                          Configure {c.name} to POST meeting summaries to this endpoint with your token. Lead names are matched automatically.
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Endpoint URL</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <code style={{ flex: 1, padding: '7px 10px', borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                              {appUrl}/api/meeting-notes
                            </code>
                            <button
                              onClick={copyUrl}
                              style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted)' }}>
                              {urlCopied ? '✓' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Your Token (paste into {c.name})</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <code style={{ flex: 1, padding: '7px 10px', borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                              {profile.id}
                            </code>
                            <button
                              onClick={copyToken}
                              style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted)' }}>
                              {tokenCopied ? '✓' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(74,144,217,.05)', border: '1px solid rgba(74,144,217,.15)', fontSize: 12, color: 'var(--muted)' }}>
                          In {c.name}, set the webhook body fields: <code style={{ color: 'var(--text)' }}>token</code>, <code style={{ color: 'var(--text)' }}>lead_name</code>, <code style={{ color: 'var(--text)' }}>summary</code>. The lead name is matched to your pipeline automatically.
                        </div>
                      </div>
                    )}

                    {/* GHL two-field input (API key + Location ID) */}
                    {isEditing && c.type === 'ghl' && (
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input
                          autoFocus
                          type="password"
                          placeholder="GHL Private Integration token…"
                          value={inputVal}
                          onChange={e => setInputVal(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
                        />
                        <input
                          type="text"
                          placeholder="GHL Location ID…"
                          value={inputVal2}
                          onChange={e => setInputVal2(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn" style={{ padding: '8px 16px', fontSize: 13 }}
                            onClick={() => saveKey(c)} disabled={saving || !inputVal.trim() || !inputVal2.trim()}>
                            {saving ? '…' : 'Connect'}
                          </button>
                          <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }}
                            onClick={() => { setEditing(null); setInputVal(''); setInputVal2(''); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* API key input */}
                    {isEditing && (c.type === 'apikey' || c.type === 'webhook') && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <input
                          autoFocus
                          type={c.type === 'apikey' ? 'password' : 'text'}
                          placeholder={
                            c.id === 'warmfollow' ? 'Paste your GHL / WarmFollow API key…' :
                            c.id === 'slack'      ? 'https://hooks.slack.com/services/...' :
                            c.type === 'webhook'  ? 'https://hooks.zapier.com/...' :
                            'Paste API key…'
                          }
                          value={inputVal}
                          onChange={e => setInputVal(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
                        />
                        <button className="btn" style={{ padding: '8px 16px', fontSize: 13 }}
                          onClick={() => saveKey(c)} disabled={saving}>
                          {saving ? '…' : 'Save'}
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }}
                          onClick={() => { setEditing(null); setInputVal(''); }}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  {c.type !== 'coming_soon' && (
                    <div style={{ flexShrink: 0, display: 'flex', gap: 6 }}>
                      {c.type === 'receive' ? (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '7px 14px', fontSize: 12 }}
                          onClick={() => setSetupOpen(setupOpen === c.id ? null : c.id)}>
                          {setupOpen === c.id ? 'Hide Setup' : 'Set Up'}
                        </button>
                      ) : connected ? (
                        <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12, color: 'var(--danger)' }}
                          onClick={() => disconnect(c)}>
                          Disconnect
                        </button>
                      ) : c.type === 'oauth' ? (
                        <a href={c.oauthUrl} className="btn" style={{ padding: '7px 14px', fontSize: 12, textDecoration: 'none' }}>
                          Connect
                        </a>
                      ) : c.type === 'ghl' ? (
                        <button
                          className="btn"
                          style={{ padding: '7px 14px', fontSize: 12 }}
                          onClick={() => {
                            setEditing(c.id);
                            setInputVal((profile as any)[c.field!] || '');
                            setInputVal2((profile as any)[c.secondField!] || '');
                          }}>
                          Connect
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '7px 14px', fontSize: 12 }}
                          onClick={() => { setEditing(c.id); setInputVal((profile as any)[c.field!] || ''); }}>
                          {(profile as any)[c.field!] ? 'Update Key' : 'Have an account?'}
                        </button>
                      )}
                      {c.docsUrl && !c.featured && c.type !== 'receive' && (
                        <a href={c.docsUrl} target="_blank" rel="noreferrer"
                          style={{ padding: '7px 10px', fontSize: 12, color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none' }}>
                          Docs ↗
                        </a>
                      )}
                      {c.docsUrl && c.type === 'receive' && setupOpen !== c.id && (
                        <a href={c.docsUrl} target="_blank" rel="noreferrer"
                          style={{ padding: '7px 10px', fontSize: 12, color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none' }}>
                          Docs ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
