// ─────────────────────────────────────────────────────────────────────────────
//  Single source of truth for invoice status computation.
//
//  Rules (in priority order):
//    1. sent_at is null             → "draft"
//    2. amount_paid >= total        → "paid"
//    3. amount_paid > 0             → "partial"
//    4. due_date is in the past     → "overdue"
//    5. otherwise                   → "sent"
// ─────────────────────────────────────────────────────────────────────────────

import type { Invoice, InvoiceStatus } from './api/invoices';

/**
 * Compute display status dynamically from invoice fields + optional
 * override for totalPaid (used in InvoiceDetail where payments are
 * fetched separately and may be more up-to-date than amount_paid).
 */
export function getInvoiceStatus(
  invoice: Pick<Invoice, 'sent_at' | 'due_date' | 'amount' | 'total' | 'amount_paid'>,
  totalPaidOverride?: number,
): InvoiceStatus {
  const paid  = totalPaidOverride ?? Number(invoice.amount_paid ?? 0);
  const total = Number(invoice.total ?? invoice.amount ?? 0);
  const now   = new Date();
  // strip time so due-date comparison is date-only
  now.setHours(0, 0, 0, 0);
  const due = new Date(invoice.due_date);
  due.setHours(0, 0, 0, 0);

  if (!invoice.sent_at) return 'draft';
  if (total > 0 && paid >= total) return 'paid';
  if (paid > 0) return 'partial';
  if (due < now) return 'overdue';
  return 'sent';
}

/** Tailwind classes for each status badge */
export function getStatusColor(status: InvoiceStatus | string): string {
  switch (status) {
    case 'paid':    return 'bg-[#A3FF3F]/10 text-[#A3FF3F] border-[#A3FF3F]/20';
    case 'overdue': return 'bg-red-500/10   text-red-400   border-red-500/20';
    case 'sent':    return 'bg-white/5      text-white/50  border-white/10';
    case 'partial': return 'bg-white/5      text-white/60  border-white/10';
    case 'draft':   return 'bg-white/5      text-white/35  border-white/10';
    default:        return 'bg-white/5      text-white/35  border-white/10';
  }
}

/** Capitalize first letter for display */
export function statusLabel(status: InvoiceStatus | string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
