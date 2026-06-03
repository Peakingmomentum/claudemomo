export type Role = 'investor' | 'agent' | 'both' | 'brokerage';

export interface DealMindUser {
  id: string;
  email: string;
  user_name: string | null;
  role: Role | null;
  copilot_name: string | null;
  market_type: string | null;
  city: string | null;
  stage: string | null;
  lead_count: string | null;
  crm: string | null;
  crm_usage: string | null;
  tools: string[] | null;
  lead_tools: string[] | null;
  website_url: string | null;
  no_website: boolean;
  tone_description: string | null;
  onboarding_complete: boolean;
  onboarding_step: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: 'inactive' | 'active' | 'canceled' | 'past_due';
  plan_activated_at: string | null;
  gmail_connected: boolean;
  gcal_connected: boolean;
  outlook_connected: boolean;
  propstream_api_key: string | null;
  batchleads_api_key: string | null;
  reiskip_api_key: string | null;
  zapier_webhook_url: string | null;
  slack_webhook_url: string | null;
  warmfollow_api_key: string | null;
  ghl_api_key: string | null;
  ghl_location_id: string | null;
  ghl_connected: boolean;
  daily_brief_cache: string | null;
  daily_brief_date: string | null;
  gcal_access_token: string | null;
  gcal_refresh_token: string | null;
  gmail_token_expiry: string | null;
}

export interface Lead {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  property: string | null;
  stage: string;
  motivation: string;
  last_contact: number;
  days_in_pipeline: number;
  notes: string | null;
  phone: string | null;
  email: string | null;
  is_dead: boolean;
  deal_value: number | null;
  ai_enrichment: {
    follow_up_sms: string[];
    follow_up_email: string;
    next_action: string;
    motivation_signals: string[];
    urgency: 'high' | 'medium' | 'low';
    enriched_at: string;
  } | null;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  content: string;
  context: string | null;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  event_type: string | null;
  lead_id: string | null;
  synced_from: string | null;
  description: string | null;
  gcal_event_id: string | null;
}

export type FlagType =
  | 'NO_CRM'
  | 'CRM_NOT_USED'
  | 'NO_WEBSITE'
  | 'HIGH_LEAD_COUNT';
