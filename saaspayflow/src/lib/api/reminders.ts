import { supabase } from '@/lib/supabase';

export interface Reminder {
  id: string;
  invoice_id: string;
  user_id: string;
  client_id?: string | null;
  channel: 'email' | 'whatsapp' | 'sms';
  tone: 'friendly' | 'firm' | 'serious';
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  sent_at: string | null;
  scheduled_for: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  
  // Joined fields
  client_name?: string;
  invoice_number?: string;
  amount?: number;
  currency?: string;
  due_date?: string;
  invoice_status?: string;
}

export interface InvoiceResponse {
  id: string;
  invoice_id: string;
  response_type: 'delay' | 'confirmation';
  reason: string;
  new_due_date: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// FETCHING
// ─────────────────────────────────────────────────────────────

export async function fetchReminders(): Promise<Reminder[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      invoice:invoices(
        invoice_number,
        amount,
        currency,
        due_date,
        status,
        client:clients(name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(r => {
    const inv = r.invoice as {
      invoice_number?: string;
      amount?: number;
      currency?: string;
      due_date?: string;
      status?: string;
      client?: { name?: string } | { name?: string }[];
    } | null;
    const client = Array.isArray(inv?.client) ? inv?.client?.[0] : inv?.client;
    return {
      ...r,
      client_name: client?.name || 'Unknown',
      invoice_number: inv?.invoice_number || '',
      amount: Number(inv?.amount || 0),
      currency: inv?.currency || 'INR',
      due_date: inv?.due_date || undefined,
      invoice_status: inv?.status || undefined,
    };
  }) as Reminder[];
}

export async function fetchPendingOverdueInvoices() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch overdue invoices + their reminder history
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(name),
      reminders(status, created_at)
    `)
    .eq('user_id', user.id)
    .eq('status', 'overdue');

  if (error) throw new Error(error.message);

  return data || [];
}

// ─────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────

export async function createReminder(payload: Omit<Reminder, 'id' | 'created_at' | 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reminders')
    .insert([{ ...payload, user_id: user.id }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  // Update invoice status if it was draft/pending?
  // Usually reminders are for sent/overdue so no status change needed on invoice
  
  return data;
}

export async function deleteReminder(reminderId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', reminderId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function submitInvoiceResponse(payload: Omit<InvoiceResponse, 'id' | 'created_at'>) {
  // Try to get user, but don't fail if not authenticated (public portal)
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('invoice_responses')
    .insert([{ 
      ...payload, 
      user_id: user?.id // Optional: link to freelancer if possible, but allow null for portal
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchInvoiceForPortal(id: string) {
  // Publicly fetch basic invoice info for the portal
  // In production, this would use a signed token/UUID
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      amount,
      currency,
      due_date,
      status,
      client:clients(name)
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
