import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Clock3, MapPin } from 'lucide-react';
import { contactFormSchema, type ContactFormValues } from '@/lib/validation';

const SUBJECT_LABELS: Record<ContactFormValues['subject'], string> = {
  general: 'General Query',
  billing: 'Billing',
  'bug-report': 'Bug Report',
  'feature-request': 'Feature Request',
  other: 'Other',
};

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: 'general',
      message: '',
    },
  });

  const onSubmit = async () => {
    setSubmitted(true);
    reset();
  };

  return (
    <main className="min-h-screen bg-[#0A0F0A] text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[720px] px-6 py-16 md:py-24">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/45 transition-colors hover:text-[#84cc16]">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-8 space-y-4">
          <p className="caption-md text-[#84cc16]">Support</p>
          <h1 className="heading-xl mt-1">Contact Support</h1>
          <p className="max-w-2xl body-md text-white/70">
            We&apos;re here to help. Most queries are answered within 24 hours.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-3xl border border-white/8 bg-[#0F1A12] p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#84cc16]/10 text-[#84cc16]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="caption-md text-white/35">Support Email</p>
                  <p className="body-sm font-medium">support@payflowai.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#84cc16]/10 text-[#84cc16]">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="caption-md text-white/35">Business Hours</p>
                  <p className="body-sm font-medium">Monday-Saturday, 9 AM-6 PM IST</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#84cc16]/10 text-[#84cc16]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="caption-md text-white/35">Location</p>
                  <p className="body-sm font-medium">Bangalore, India</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/8 bg-[#0F1A12] p-6">
            {submitted ? (
              <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#84cc16]/20 bg-[#84cc16]/10">
                  <Mail className="h-7 w-7 text-[#84cc16]" />
                </div>
                <h2 className="heading-lg">Message sent</h2>
                <p className="mt-2 max-w-sm body-md text-white/65">
                  We&apos;ve received your message and will reply as soon as possible.
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Input placeholder="Your name" className="h-12 bg-black/20 border-white/10" {...register('name')} />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Input type="email" placeholder="Your email" className="h-12 bg-black/20 border-white/10" {...register('email')} />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <select
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#84cc16]/40"
                    defaultValue="general"
                    {...register('subject')}
                  >
                    {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.subject && <p className="mt-1 text-xs text-red-400">{errors.subject.message}</p>}
                </div>

                <div>
                  <textarea
                    placeholder="Message"
                    rows={5}
                    className="min-h-[160px] w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-7 outline-none placeholder:text-white/25 focus:border-[#84cc16]/40"
                    {...register('message')}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message.message}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl bg-[#84cc16] font-semibold text-[#0A0F0A] hover:bg-[#a3e635]">
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>

                <p className="body-sm text-white/60">
                  We typically respond within 24 hours. For urgent billing issues, include your account email in the subject line.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
