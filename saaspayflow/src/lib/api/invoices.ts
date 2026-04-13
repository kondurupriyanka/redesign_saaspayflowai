import { supabase } from '@/lib/supabase';
import { type Client } from './clients';

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
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
  share_token: string | null;
  subtotal: number | null;
  tax: number;
  tax_percent: number;
  total: number | null;
  amount: number;
  amount_paid: number;
  line_items: LineItem[];
  created_at: string;
  updated_at: string;
  reminders?: Array<{
    id: string;
    status: string;
    created_at: string;
    tone?: 'friendly' | 'firm' | 'serious';
    channel?: 'email' | 'whatsapp' | 'sms';
    message?: string;
    sent_at?: string | null;
    scheduled_for?: string;
  }>;
  client?: Client;
}

export type InvoiceFormData = Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client'>;

export interface InvoiceMessage {
  id: string;
  invoice_id: string;
  sender: 'client' | 'freelancer';
  message: string;
  created_at: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  reference: string | null;
  status: 'pending' | 'confirmed';
  created_at: string;
}

export interface InvoiceRequest {
  id: string;
  invoice_id: string;
  type: 'extension' | 'dispute';
  reason: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  invoice_id: string;
  type: string;
  data: Record<string, any>;
  created_at: string;
}

// ─────────────────────────────────────────────
//  EXPRESS API HELPER
// ─────────────────────────────────────────────
async function apiReq<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as any)?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}

function coerce(inv: any): Invoice {
  return {
    ...inv,
    amount:      Number(inv.amount      ?? 0),
    amount_paid: Number(inv.amount_paid ?? 0),
    subtotal:    inv.subtotal != null ? Number(inv.subtotal) : null,
    tax:         Number(inv.tax         ?? 0),
    tax_percent: Number(inv.tax_percent ?? 0),
    total:       inv.total   != null ? Number(inv.total)    : null,
    line_items:  Array.isArray(inv.line_items) ? inv.line_items : [],
    reminders:   Array.isArray(inv.reminders)  ? inv.reminders  : [],
  } as Invoice;
}

// ─────────────────────────────────────────────
//  INVOICE CRUD
// ─────────────────────────────────────────────

export async function fetchInvoices(): Promise<Invoice[]> {
  const raw = await apiReq<any[]>('/invoices');
  return raw.map(coerce);
}

export async function fetchInvoiceById(id: string): Promise<Invoice> {
  const raw = await apiReq<any>(`/invoices/${id}`);
  return coerce(raw);
}

export async function createInvoice(data: InvoiceFormData, method: 'draft' | 'send'): Promise<Invoice> {
  const subtotal   = data.subtotal    ?? data.amount;
  const taxAmount  = data.tax         ?? 0;
  const taxPercent = data.tax_percent ?? 0;
  const total      = data.total       ?? data.amount;

  const raw = await apiReq<any>('/invoices', {
    method: 'POST',
    body: JSON.stringify({
      clientId:   data.client_id,
      title:      data.title || data.description || null,
      description: data.description || null,
      currency:   data.currency || 'INR',
      dueDate:    data.due_date,
      status:     method === 'send' ? 'sent' : 'draft',
      subtotal,
      taxPercent,
      taxAmount,
      total,
      lineItems:  data.line_items || [],
    }),
  });
  return coerce(raw);
}

export async function sendInvoice(id: string): Promise<{ invoice: Invoice; token: string; shareUrl: string }> {
  const raw = await apiReq<{ invoice: any; token: string }>(`/invoices/${id}/send`, { method: 'POST' });
  const shareUrl = `${window.location.origin}/invoice/${raw.token}`;
  return { invoice: coerce(raw.invoice), token: raw.token, shareUrl };
}

export async function fetchPublicInvoice(token: string): Promise<any> {
  const res = await fetch(`/api/invoices/public/${token}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any)?.error || 'Invoice not found');
  return body;
}

export async function updateInvoiceStatus(id: string, status: string): Promise<void> {
  await apiReq(`/invoices/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiReq(`/invoices/${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────
//  FREELANCER — client interaction read/actions
// ─────────────────────────────────────────────

export async function fetchInvoiceMessages(invoiceId: string): Promise<InvoiceMessage[]> {
  return apiReq<InvoiceMessage[]>(`/invoices/${invoiceId}/messages`);
}

export async function sendFreelancerMessage(invoiceId: string, message: string): Promise<InvoiceMessage> {
  return apiReq<InvoiceMessage>(`/invoices/${invoiceId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function fetchPendingPayments(invoiceId: string): Promise<InvoicePayment[]> {
  return apiReq<InvoicePayment[]>(`/invoices/${invoiceId}/pending-payments`);
}

export async function confirmInvoicePayment(invoiceId: string, paymentId: string): Promise<void> {
  await apiReq(`/invoices/${invoiceId}/pending-payments/${paymentId}/confirm`, { method: 'POST' });
}

export async function fetchInvoiceRequests(invoiceId: string): Promise<InvoiceRequest[]> {
  return apiReq<InvoiceRequest[]>(`/invoices/${invoiceId}/requests`);
}

export async function updateRequestStatus(invoiceId: string, requestId: string, status: 'approved' | 'rejected'): Promise<void> {
  await apiReq(`/invoices/${invoiceId}/requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function fetchInvoiceActivity(invoiceId: string): Promise<ActivityEvent[]> {
  return apiReq<ActivityEvent[]>(`/invoices/${invoiceId}/activity`);
}

// ─────────────────────────────────────────────
//  PUBLIC CLIENT PORTAL
// ─────────────────────────────────────────────

async function publicPost(token: string, path: string, data: Record<string, any>): Promise<any> {
  const res = await fetch(`/api/invoices/public/${token}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any)?.error || 'Request failed');
  return body;
}

export function submitClientPayment(token: string, data: { amount: number; method: string; reference?: string }) {
  return publicPost(token, 'pay', data);
}

export function sendClientMessage(token: string, data: { message: string }) {
  return publicPost(token, 'message', data);
}

export function submitClientRequest(token: string, data: { type: string; reason: string; message?: string }) {
  return publicPost(token, 'request', data);
}

// Legacy compat
export function confirmPayment(token: string, data: { amount: number; method: string; note?: string }) {
  return publicPost(token, 'confirm-payment', data);
}
export function requestExtension(token: string, data: { reason: string; message?: string }) {
  return publicPost(token, 'request-extension', data);
}

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  return `PF-${year}-0001`;
}
