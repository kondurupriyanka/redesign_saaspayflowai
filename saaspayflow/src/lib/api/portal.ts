import { supabase } from '@/lib/supabase';

export interface PortalInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  description: string | null;
  line_items?: any[];
  tax_percent?: number;
}

export interface PortalMilestone {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  order: number;
}

export interface PortalProject {
  id: string;
  name: string;
  description: string | null;
  progress_percent: number;
  status: string;
  milestones: PortalMilestone[];
}

export interface PortalData {
  client_id: string;
  client_name: string;
  freelancer_name: string;
  freelancer_id: string;
  invoices: PortalInvoice[];
  projects: PortalProject[];
}


/**
 * Fetches all relevant portal data using the magic portal token.
 * This RPC bypasses normal Auth as it's a public-facing portal.
 */
export async function fetchPortalData(token: string): Promise<PortalData | null> {
  const { data, error } = await supabase.rpc('fetch_portal_data', { p_token: token });
  
  if (error) {
    console.error('Error fetching portal data:', error);
    return null;
  }
  
  return data as PortalData;
}

/**
 * Client submission of a reason for payment delay.
 */
export async function submitDelayReason(data: {
  invoice_id: string;
  client_id: string;
  reason_type: string;
  custom_reason?: string;
  scheduled_date?: string;
  freelancer_id: string;
}): Promise<void> {
  // 1. Insert delay reason
  const { error: dErr } = await supabase
    .from('delay_reasons')
    .insert([{
      invoice_id: data.invoice_id,
      client_id: data.client_id,
      reason_type: data.reason_type,
      custom_reason: data.custom_reason,
      scheduled_date: data.scheduled_date
    }]);

  if (dErr) throw new Error(dErr.message);

  // 2. Create notification for the freelancer
  const { error: nErr } = await supabase
    .from('notifications')
    .insert([{
      user_id: data.freelancer_id,
      type: 'alert',
      title: 'Payment Delay Notification',
      message: `Client has submitted a delay reason for invoice. Reason: ${data.reason_type}`,
      is_read: false
    }]);

  if (nErr) {
    console.error('Failed to create freelancer notification:', nErr);
  }
}
