import type { Lead } from '@/types';

// ─── Lead scoring ─────────────────────────────────────────────────────────────
// Returns 0–100 normalized score. Notes activity + AI urgency both contribute.
// Shared by the pipeline (MyLeads) and the daily brief so both rank identically.

export function scoreLead(lead: Lead): number {
  let raw = 0;

  // Motivation (0–40)
  raw += ({ High: 40, Medium: 25, Low: 10, Unknown: 5 } as Record<string, number>)[lead.motivation] ?? 5;

  // Stage (0–35) — hotter temperature = more valuable (Closed already won)
  raw += ({
    'Hot Lead': 35, 'Warm Lead': 24, 'New Lead': 14, 'Cold Lead': 6, Closed: 0,
  } as Record<string, number>)[lead.stage] ?? 10;

  // Recency of last contact (0–25) — fresh contact = higher score
  if      (lead.last_contact === 0)  raw += 25;
  else if (lead.last_contact <= 3)   raw += 20;
  else if (lead.last_contact <= 7)   raw += 12;
  else if (lead.last_contact <= 14)  raw += 5;

  // AI urgency from enrichment — includes note analysis (0–20)
  if (lead.ai_enrichment) {
    raw += ({ high: 20, medium: 12, low: 5 } as Record<string, number>)[lead.ai_enrichment.urgency] ?? 0;
  }

  // Notes activity: each timestamped entry signals engagement (0–15)
  if (lead.notes) {
    const entryCount = (lead.notes.match(/^\[/gm) || []).length;
    raw += Math.min(entryCount * 3, 15);
  }

  // Contact completeness — more info = more actionable (0–5)
  if (lead.phone) raw += 3;
  if (lead.email) raw += 2;

  // Normalize to 0–100 (max raw ≈ 140)
  return Math.min(100, Math.round((raw / 140) * 100));
}
