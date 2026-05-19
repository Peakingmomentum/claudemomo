'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/Icon';
import type { Lead, DealMindUser } from '@/types';

const STAGES = ['New Lead', 'Contacted', 'Nurturing', 'Negotiating', 'Under Contract', 'Closed', 'Dead'];
const MOTIVATIONS = ['Unknown', 'Low', 'Medium', 'High'];

interface Props {
  profile: DealMindUser;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

export function MyLeads({ profile, leads, setLeads }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<Lead>>({ name: '', property: '', stage: 'New Lead', motivation: 'Unknown' });

  async function addLead() {
    if (!draft.name?.trim()) return;
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...draft, user_id: profile.id })
      .select()
      .single();
    if (!error && data) {
      setLeads(l => [data as Lead, ...l]);
      setDraft({ name: '', property: '', stage: 'New Lead', motivation: 'Unknown' });
      setAdding(false);
    }
  }

  async function updateLead(id: string, patch: Partial<Lead>) {
    const { data, error } = await supabase.from('leads').update(patch).eq('id', id).select().single();
    if (!error && data) {
      setLeads(l => l.map(x => x.id === id ? (data as Lead) : x));
    }
  }

  async function deleteLead(id: string) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (!error) setLeads(l => l.filter(x => x.id !== id));
  }

  const active = leads.filter(l => !l.is_dead);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{active.length} active leads</h2>
        <button className="btn" onClick={() => setAdding(a => !a)}>
          <Icon name="plus" /> Add lead
        </button>
      </div>

      {adding && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="Lead name" value={draft.name || ''} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
          <input placeholder="Property / address" value={draft.property || ''} onChange={e => setDraft(d => ({ ...d, property: e.target.value }))} />
          <input placeholder="Phone" value={draft.phone || ''} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
          <input placeholder="Email" value={draft.email || ''} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
          <select value={draft.stage || 'New Lead'} onChange={e => setDraft(d => ({ ...d, stage: e.target.value }))}>
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={draft.motivation || 'Unknown'} onChange={e => setDraft(d => ({ ...d, motivation: e.target.value }))}>
            {MOTIVATIONS.map(m => <option key={m}>{m}</option>)}
          </select>
          <textarea placeholder="Notes" value={draft.notes || ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} style={{ minHeight: 60 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={addLead}>Save</button>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {active.map(l => (
        <LeadCard
          key={l.id}
          lead={l}
          onUpdate={patch => updateLead(l.id, patch)}
          onDelete={() => deleteLead(l.id)}
        />
      ))}

      {active.length === 0 && !adding && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          No leads yet. Click "Add lead" to start.
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead, onUpdate, onDelete
}: {
  lead: Lead;
  onUpdate: (patch: Partial<Lead>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
           onClick={() => setExpanded(e => !e)}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{lead.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {lead.property || ''} · {lead.stage} · {lead.motivation} motivation
          </div>
        </div>
        <div style={{
          padding: '4px 10px',
          background: lead.last_contact >= 7 ? 'rgba(255,92,124,0.15)' : 'var(--surface)',
          color: lead.last_contact >= 7 ? 'var(--danger)' : 'var(--muted)',
          borderRadius: 999, fontSize: 12, fontWeight: 600
        }}>
          {lead.last_contact}d cold
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select value={lead.stage} onChange={e => onUpdate({ stage: e.target.value })}>
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={lead.motivation} onChange={e => onUpdate({ motivation: e.target.value })}>
            {MOTIVATIONS.map(m => <option key={m}>{m}</option>)}
          </select>
          <input type="number" min="0" value={lead.last_contact}
                 onChange={e => onUpdate({ last_contact: Number(e.target.value) })}
                 placeholder="Days since last contact" />
          <textarea value={lead.notes || ''} onChange={e => onUpdate({ notes: e.target.value })}
                    placeholder="Notes" style={{ minHeight: 60 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => onUpdate({ is_dead: true })}>Mark dead</button>
            <button className="btn btn-ghost" onClick={onDelete} style={{ color: 'var(--danger)' }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
