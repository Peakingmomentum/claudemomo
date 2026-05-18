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
}

export type FlagType =
  | 'NO_CRM'
  | 'CRM_NOT_USED'
  | 'NO_WEBSITE'
  | 'HIGH_LEAD_COUNT';
