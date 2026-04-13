import { apiRequest } from './client';
import { supabase } from '@/lib/supabase';

// ── Shape returned by GET /api/settings ──────────────────────────────────────
export interface SettingsRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  business_name: string | null;
  avatar_url: string | null;
  invoice_prefix: string | null;
  default_currency: string | null;
  default_tax: number | null;
  notify_invoice_viewed: boolean | null;
  notify_payment_received: boolean | null;
  notify_daily_digest: boolean | null;
  reminder_days: number | null;
  payment_info: {
    upi_id?: string;
    upi_name?: string;
    bank_name?: string;
    account_name?: string;
    account_number?: string;
    ifsc?: string;
    account_type?: string;
    paypal_email?: string;
  } | null;
}

// ── Fetch all settings for the current user ───────────────────────────────────
export async function fetchSettings(): Promise<SettingsRow> {
  return apiRequest<SettingsRow>('/settings');
}

// ── Save profile fields ───────────────────────────────────────────────────────
export async function saveProfileSettings(payload: {
  business_name: string;
  full_name: string;
  phone: string;
  invoice_prefix: string;
  default_currency: string;
  default_tax: number;
}): Promise<SettingsRow> {
  console.log('[settings] Saving profile:', payload);
  const data = await apiRequest<SettingsRow>('/settings', 'PUT', payload);
  console.log('[settings] Profile saved response:', data);
  return data;
}

// ── Save payment info ─────────────────────────────────────────────────────────
export async function savePaymentSettings(payment_info: {
  upi_id: string;
  upi_name: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  ifsc: string;
  account_type: string;
  paypal_email: string;
}): Promise<SettingsRow> {
  console.log('[settings] Saving payment info:', payment_info);
  const data = await apiRequest<SettingsRow>('/settings', 'PUT', { payment_info });
  console.log('[settings] Payment info saved response:', data);
  return data;
}

// ── Save notification preferences ────────────────────────────────────────────
export async function saveNotificationSettings(payload: {
  notify_invoice_viewed: boolean;
  notify_payment_received: boolean;
  notify_daily_digest: boolean;
  reminder_days: number;
}): Promise<SettingsRow> {
  console.log('[settings] Saving notifications:', payload);
  const data = await apiRequest<SettingsRow>('/settings', 'PUT', payload);
  console.log('[settings] Notifications saved response:', data);
  return data;
}

// ── Save avatar URL ────────────────────────────────────────────────────────────
export async function saveAvatarUrl(avatar_url: string): Promise<SettingsRow> {
  return apiRequest<SettingsRow>('/settings', 'PUT', { avatar_url });
}

// ── Backwards-compatible alias (used by OnboardingFlow and other components) ──
// Sends the payload to the existing PUT /auth/me route which the backend
// still handles; all new code should prefer the section-specific save functions above.
export async function updateProfileSettings(updates: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>('/auth/me', 'PUT', updates);
}

// ── Upload avatar file ────────────────────────────────────────────────────────
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image must be smaller than 2 MB');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
    throw new Error('Unsupported file type. Use JPG, PNG, GIF, or WebP.');
  }

  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type,
    });

  if (error) {
    throw new Error(
      error.message.includes('bucket')
        ? 'Avatar storage is not configured. Please set up a public "avatars" bucket in Supabase Storage.'
        : `Upload failed: ${error.message}`
    );
  }

  const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return publicData.publicUrl;
}
