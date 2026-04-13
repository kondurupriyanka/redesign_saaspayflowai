import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  company_name: string | null;
  address: string | null;
  gst_number: string | null;
  pan_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientWithStats extends Client {
  totalBilled: number;
  totalPaid: number;
  overdueAmount: number;
  invoiceCount: number;
}

export interface ClientInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  created_at: string;
  description: string | null;
}

export type ClientFormData = {
  name: string;
  email: string | null;
  phone: string | null;
  company_name?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  notes?: string | null;
};

// ─────────────────────────────────────────────
//  AUTH HEADER HELPER
// ─────────────────────────────────────────────
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`/api${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any)?.error || `Request failed (${res.status})`);
  return body as T;
}

// ─────────────────────────────────────────────
//  CLIENT LIST (with stats from backend)
// ─────────────────────────────────────────────
export async function fetchClients(search?: string): Promise<ClientWithStats[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}&limit=200` : '?limit=200';
  const data = await apiRequest<{ clients: any[] }>(`/clients${qs}`);
  return (data.clients || []).map(c => ({
    ...c,
    totalBilled:   Number(c.total_billed   ?? c.totalBilled   ?? 0),
    totalPaid:     Number(c.total_paid     ?? c.totalPaid     ?? 0),
    overdueAmount: Number(c.overdue_amount ?? c.overdueAmount ?? 0),
    invoiceCount:  Number(c.invoice_count  ?? c.invoiceCount  ?? 0),
  }));
}

// ─────────────────────────────────────────────
//  CLIENT DETAIL
// ─────────────────────────────────────────────
export async function fetchClientDetail(clientId: string): Promise<{
  client: Client;
  invoices: ClientInvoice[];
  totalBilled: number;
  totalPaid: number;
}> {
  const [client, stats] = await Promise.all([
    apiRequest<Client>(`/clients/${clientId}`),
    apiRequest<{ totalInvoiced: number; totalPaid: number }>(`/clients/${clientId}/statistics`),
  ]);

  return {
    client,
    invoices: [],
    totalBilled: stats.totalInvoiced,
    totalPaid: stats.totalPaid,
  };
}

// ─────────────────────────────────────────────
//  MUTATIONS
// ─────────────────────────────────────────────
export async function createClient(data: ClientFormData): Promise<Client> {
  return apiRequest<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify({
      name:         data.name,
      email:        data.email || null,
      phone:        data.phone || null,
      whatsapp:     data.whatsapp || null,
      companyName:  data.company_name || null,
      address:      data.address || null,
      gstNumber:    data.gst_number || null,
      panNumber:    data.pan_number || null,
    }),
  });
}

export async function updateClient(id: string, data: Partial<ClientFormData> & { notes?: string | null }): Promise<Client> {
  return apiRequest<Client>(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name:        data.name,
      email:       data.email || null,
      phone:       data.phone || null,
      whatsapp:    data.whatsapp || null,
      companyName: data.company_name || null,
      address:     data.address || null,
      gstNumber:   data.gst_number || null,
      panNumber:   data.pan_number || null,
      notes:       data.notes ?? null,
    }),
  });
}

export async function deleteClient(id: string): Promise<void> {
  await apiRequest<void>(`/clients/${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────
//  PORTAL TOKEN
// ─────────────────────────────────────────────
export async function generatePortalLink(clientId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_portal_token', { p_client_id: clientId });
  if (error) throw new Error(error.message);
  return `${window.location.origin}/portal/${data as string}`;
}
