import { apiRequest } from './client';
import { supabase } from '@/lib/supabase';

export interface PaymentFormData {
  invoice_id: string;
  amount: number;
  method: string;
  reference?: string | null;
  notes?: string | null;
}

export interface Payment {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  status: string;
  payment_date: string;
  paid_at: string | null;
  created_at: string;
}

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export async function createPayment(payload: PaymentFormData): Promise<Payment> {
  const result = await apiRequest<Payment>('/payments', 'POST', {
    invoiceId: payload.invoice_id,
    amount: payload.amount,
    method: payload.method,
    reference: payload.reference ?? null,
    notes: payload.notes ?? null,
  });
  return result;
}

export async function completePortalPayment(payload: PaymentFormData & { token: string }) {
  const response = await fetch('/api/payments/public/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: payload.token,
      invoiceId: payload.invoice_id,
      amount: payload.amount,
      method: payload.method,
      reference: payload.reference ?? null,
      notes: payload.notes ?? null,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Failed to complete portal payment');
  return body;
}

export async function fetchInvoicePayments(invoiceId: string): Promise<Payment[]> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`/api/payments/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error || 'Failed to load payments');
  }
  const data = await res.json();
  return (data || []).map((p: any) => ({ ...p, amount: Number(p.amount) })) as Payment[];
}
