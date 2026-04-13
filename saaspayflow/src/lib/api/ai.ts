import { apiRequest } from './client';

export interface AiInvoiceExtraction {
  client_name: string;
  project_title: string;
  amount: number;
  currency: string;
  due_date_days: number;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  tax_percent: number;
}

export interface AiReminderInput {
  client_name: string;
  invoice_number: string;
  amount: number;
  currency: string;
  days_overdue: number;
  tone: 'friendly' | 'firm' | 'serious';
}

export interface AiReminderOutput {
  tone: 'friendly' | 'firm' | 'serious';
  subject: string;
  message: string;
}

export async function extractInvoiceFromDocument(
  base64File: string,
  mimeType: string
): Promise<AiInvoiceExtraction> {
  const result = await apiRequest<{ data: AiInvoiceExtraction }>('/ai/invoices/extract', 'POST', {
    base64File,
    mimeType,
  });
  return result.data;
}

export async function generateReminderText(data: AiReminderInput): Promise<string> {
  const result = await apiRequest<{ data: AiReminderOutput }>('/ai/reminders/generate', 'POST', data as unknown as Record<string, unknown>);
  return result.data.message;
}
