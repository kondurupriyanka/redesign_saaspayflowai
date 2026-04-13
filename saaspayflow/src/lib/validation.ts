import { z } from 'zod';

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required'),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g. name@company.com)'),
  phone: z
    .string()
    .trim()
    .refine(val => !val || /^\+?[\d\s\-().]{6,20}$/.test(val), {
      message: 'Phone must contain numbers only (digits, spaces, +, -, ())',
    })
    .optional()
    .nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  company_name: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  gst_number: z.string().trim().optional().nullable(),
  pan_number: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const invoiceLineItemSchema = z.object({
  description: z.string().trim().min(1, 'Line item description is required'),
  quantity: z.number().finite().positive('Quantity must be greater than zero'),
  unit_price: z.number().finite().min(0, 'Unit price must be zero or greater'),
});

export const invoiceDraftSchema = z.object({
  clientId: z.string().uuid('Select a client'),
  invoiceTitle: z.string().trim().min(1, 'Invoice title is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  currency: z.string().trim().min(1, 'Currency is required'),
  taxPercent: z.number().finite().min(0, 'Tax must be zero or greater'),
  lineItems: z.array(invoiceLineItemSchema).min(1, 'Add at least one line item'),
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Please enter a valid email address'),
  subject: z.enum(['general', 'billing', 'bug-report', 'feature-request', 'other']),
  message: z.string().trim().min(20, 'Please enter a more detailed message'),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
