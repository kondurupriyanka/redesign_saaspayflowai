import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient, updateClient, type Client, type ClientFormData } from '@/lib/api/clients';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Client | null;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_RE = /^[+\d\s\-().]*$/;
const PHONE_VALID_RE = /^[+\d\s\-().]{6,20}$/;

const EMPTY: FormState = { name: '', email: '', phone: '' };

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Full name is required';
  }

  if (!form.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Enter a valid email address (e.g. name@company.com)';
  }

  if (form.phone.trim() && !PHONE_VALID_RE.test(form.phone.trim())) {
    errors.phone = 'Phone must be 6–20 characters: digits, spaces, +, -, ()';
  }

  return errors;
}

interface FieldProps {
  label: string;
  icon: React.ElementType;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, icon: Icon, error, required, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-white/50">
        <Icon className="w-3.5 h-3.5" />
        {label}
        {required && <span className="text-[#A3FF3F]">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold flex items-center justify-center shrink-0">!</span>
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-white/25">{hint}</p>
      ) : null}
    </div>
  );
}

export function ClientSlideOver({ open, onClose, existing }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  const isEdit = !!existing;

  useEffect(() => {
    if (open) {
      setForm(
        existing
          ? { name: existing.name, email: existing.email ?? '', phone: existing.phone ?? '' }
          : EMPTY
      );
      setErrors({});
      setTouched({});
      if (!existing) setTimeout(() => nameRef.current?.focus(), 80);
    }
  }, [open, existing]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (key: keyof FormState, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    // Revalidate that field if it was already touched
    if (touched[key]) {
      const next = validate({ ...form, [key]: val });
      setErrors(prev => ({ ...prev, [key]: next[key] }));
    }
  };

  const handlePhoneInput = (val: string) => {
    // Silently strip letters, only allow phone-valid characters
    const cleaned = val.replace(/[^\d\s+\-().]/g, '');
    set('phone', cleaned);
  };

  const touch = (key: keyof FormState) => {
    setTouched(prev => ({ ...prev, [key]: true }));
    const next = validate(form);
    setErrors(prev => ({ ...prev, [key]: next[key] }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: ClientFormData = {
        name:  form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      };
      return isEdit ? updateClient(existing!.id, payload) : createClient(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      if (isEdit) qc.invalidateQueries({ queryKey: ['client', existing!.id] });
      toast.success(isEdit ? 'Client updated!' : 'Client added!');
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true });
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) mutation.mutate();
  };

  const inputCls = (key: keyof FormState) =>
    cn(
      'w-full bg-[#0A0F0A] border rounded-xl px-3.5 py-2.5 text-sm text-white',
      'placeholder:text-white/25 focus:outline-none focus:ring-1 transition-colors',
      errors[key] && touched[key]
        ? 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20'
        : 'border-white/10 focus:border-[#A3FF3F]/50 focus:ring-[#A3FF3F]/20',
    );

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px]',
          'bg-[#0F1A12] border-l border-white/10 shadow-2xl shadow-black/60',
          'flex flex-col transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 shrink-0">
          <div>
            <h2 className="font-semibold text-base text-white">
              {isEdit ? 'Edit Client' : 'Add New Client'}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {isEdit ? `Updating ${existing!.name}` : 'Fill in the details below'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5" noValidate>

          {/* Name */}
          <Field
            label="Full Name"
            icon={User}
            required
            error={touched.name ? errors.name : undefined}
          >
            <input
              ref={nameRef}
              className={inputCls('name')}
              placeholder="e.g. Rajesh Kumar"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onBlur={() => touch('name')}
              autoComplete="name"
            />
          </Field>

          {/* Email */}
          <Field
            label="Email Address"
            icon={Mail}
            required
            error={touched.email ? errors.email : undefined}
          >
            <input
              type="email"
              className={inputCls('email')}
              placeholder="rajesh@company.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              onBlur={() => touch('email')}
              autoComplete="email"
            />
          </Field>

          {/* Phone */}
          <Field
            label="Phone Number"
            icon={Phone}
            error={touched.phone ? errors.phone : undefined}
            hint="Optional · numbers, spaces, +, -, () only"
          >
            <input
              type="tel"
              className={inputCls('phone')}
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => handlePhoneInput(e.target.value)}
              onBlur={() => touch('phone')}
              autoComplete="tel"
              inputMode="tel"
            />
          </Field>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/12 text-sm font-medium text-white/60 hover:text-white hover:border-white/25 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-[#A3FF3F] text-[#0A0F0A] text-sm font-semibold hover:bg-[#b8ff5c] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </div>
    </>
  );
}
