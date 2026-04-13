// =============================================================
//  PayFlow AI — Database types (aligned with Supabase schema)
// =============================================================

// ─────────────────────────────────────────────────────────────
//  USERS
// ─────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  business_name?: string | null;
  avatar_url?: string | null;
  invoice_prefix: string;
  default_currency: string;
  default_tax: number;
  plan: 'free' | 'pro' | 'growth';
  trial_end: string | null;
  is_owner: boolean;
  onboarding_completed: boolean;
  notify_invoice_viewed: boolean;
  notify_payment_received: boolean;
  notify_daily_digest: boolean;
  reminder_days: number;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
//  CLIENTS
// ─────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  company_name?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
//  INVOICES
// ─────────────────────────────────────────────────────────────
export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  created_at: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  title: string | null;
  description: string | null;
  currency: string;
  status: InvoiceStatus;
  due_date: string;
  paid_date: string | null;
  sent_at: string | null;
  subtotal: number | null;
  tax: number;
  tax_percent: number;
  total: number | null;
  amount: number;
  line_items: LineItem[];
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
//  PAYMENTS
// ─────────────────────────────────────────────────────────────
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'cancelled';

export interface Payment {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: number;
  method: string;
  reference?: string | null;
  notes?: string | null;
  provider: string;
  provider_transaction_id?: string | null;
  failure_reason?: string | null;
  status: PaymentStatus;
  payment_date: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
//  REMINDERS
// ─────────────────────────────────────────────────────────────
export interface Reminder {
  id: string;
  user_id: string;
  invoice_id: string;
  client_id: string | null;
  channel: 'email' | 'whatsapp' | 'sms';
  message: string;
  tone: 'friendly' | 'firm' | 'serious';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sent_at: string | null;
  scheduled_for: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
//  BILLING
// ─────────────────────────────────────────────────────────────
export interface SubscriptionPlan {
  id: 'free' | 'pro' | 'growth';
  name: string;
  price: number;
  currency: string;
  paddleProductId: string | null;
  features: {
    maxClients: number;
    aiReminders: boolean;
    recurringInvoices: boolean;
    clientPortal: boolean;
    emailNotifications: boolean;
    advancedAnalytics: boolean;
    whatsappSupport: boolean;
  };
}

// ─────────────────────────────────────────────────────────────
//  API RESPONSES
// ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ─────────────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
