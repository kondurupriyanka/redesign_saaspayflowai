import { Shield } from 'lucide-react';
import { LegalPageLayout } from '@/components/LegalPageLayout';

const sections = [
  {
    title: '1. Introduction and Who We Are',
    body: [
      'This Privacy Policy explains how PayFlow AI collects, uses, stores, and protects personal data when you use our website, dashboard, invoices, reminders, and client portal.',
      'PayFlow AI is a product used by freelancers and businesses to manage invoicing, reminders, and payment follow-up communication.',
    ],
  },
  {
    title: '2. Information We Collect',
    body: [
      'We may collect account data such as your name, email address, business name, and login details. We also collect invoice data, client data, payment information, message content, and usage analytics needed to operate the service.',
      'If you use billing or payment features, we may also receive transaction-related details from Paddle or other payment-related systems used to complete the purchase or subscription.',
    ],
  },
  {
    title: '3. How We Use Your Information',
    body: [
      'We use your information to create and manage accounts, generate invoices, send reminders, deliver email notifications, provide analytics, process payments, detect abuse, and improve the product.',
      'We may also use information to respond to support requests, maintain security, enforce our Terms, and satisfy legal obligations.',
    ],
  },
  {
    title: '4. Legal Basis for Processing',
    body: [
      'If you are located in the European Economic Area, United Kingdom, or another region with similar rules, we process personal data based on contract performance, legitimate interests, consent where required, and legal compliance.',
      'Our legitimate interests include operating a secure, reliable invoicing and reminder platform and protecting the integrity of the service.',
    ],
  },
  {
    title: '5. Data Sharing',
    body: [
      'We do not sell your personal data. We may share limited information with service providers that help us operate the platform, including Supabase for data storage and authentication, Paddle for payments, and Resend for email delivery.',
      'We may also disclose information if required by law, to protect our rights, or to investigate abuse, security incidents, or fraud.',
    ],
  },
  {
    title: '6. Data Retention',
    body: [
      'We keep account data and related business records while your account remains active or as needed to provide the service. If you close your account, we will delete or anonymize your account data within 30 days unless retention is required for legal, accounting, security, or fraud-prevention purposes.',
      'Some backup systems may retain encrypted copies for a limited period before they are overwritten in the ordinary course of operations.',
    ],
  },
  {
    title: '7. Your Rights',
    body: [
      'Depending on your location, you may have rights to access, correct, delete, export, or restrict the use of your personal data. You may also object to certain processing activities where applicable.',
      'You can contact us to request help with your data rights, and we will respond in accordance with applicable law.',
    ],
  },
  {
    title: '8. Cookies and Tracking',
    body: [
      'We use cookies and similar technologies to keep you signed in, remember preferences, measure usage, and improve the product experience. We may also use analytics tools to understand feature usage and performance.',
      'You can control cookies through your browser settings, but some parts of the service may not function properly if cookies are disabled.',
    ],
  },
  {
    title: '9. Security Measures',
    body: [
      'We use technical and organizational safeguards such as authenticated access, server-side secret storage, encryption in transit, and row-level security for data access where supported by our stack.',
      'No system is perfectly secure, but we work to protect your information and to reduce risk through access controls, monitoring, and secure configuration practices.',
    ],
  },
  {
    title: "10. Children's Privacy",
    body: ['PayFlow AI is not intended for children under the age of 18, and we do not knowingly collect personal data from children. If we learn that we have collected such data, we will take steps to delete it.'],
  },
  {
    title: '11. Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time to reflect legal, operational, or product changes. The date at the top of this page will show the latest revision date.',
      'We encourage you to review this page periodically so you remain informed about how we handle information.',
    ],
  },
  {
    title: '12. Contact',
    body: ['For privacy requests or questions, please contact privacy@payflowai.com.'],
  },
];

export function PrivacyPolicy() {
  return (
    <LegalPageLayout
      icon={Shield}
      label="Legal"
      title="Privacy Policy"
      lastUpdated="April 8, 2026"
      intro="We respect your privacy and try to collect only the data needed to provide a secure, reliable invoicing and payment reminder service. This page explains what we collect and how we use it."
      sections={sections}
    />
  );
}
