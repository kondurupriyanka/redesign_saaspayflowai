import { FileText } from 'lucide-react';
import { LegalPageLayout } from '@/components/LegalPageLayout';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: [
      'By accessing or using PayFlow AI, you agree to these Terms of Service and any policies referenced in them. If you do not agree, you must not use the service.',
      'These Terms form a binding agreement between you and PayFlow AI for your use of the website, dashboard, client portal, and related services.',
    ],
  },
  {
    title: '2. Description of Service',
    body: [
      'PayFlow AI is an AI-powered invoicing and payment reminder tool for freelancers, consultants, and small businesses. The service helps users create invoices, track overdue payments, generate reminder messages, and monitor collection activity.',
      'We may improve, change, or discontinue features from time to time, but we will aim to preserve the core invoicing and reminder experience.',
    ],
  },
  {
    title: '3. Account Registration and Security',
    body: [
      'You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.',
      'If you suspect unauthorized access or a security issue, you must notify us promptly so we can help protect your account and associated data.',
    ],
  },
  {
    title: '4. Subscription Plans and Billing',
    body: [
      'PayFlow AI offers Free, Pro, and Growth plans. Current pricing is displayed on our website and in-app at the time of purchase. Paid subscriptions are processed through Paddle, our payment provider.',
      'Free: $0/month, up to 2 clients, basic invoicing, and manual reminders. Pro: $29/month, up to 15 clients, AI reminders, smart follow-ups, and unlimited invoices. Growth: $49/month, up to 50 clients, everything in Pro, advanced AI, and revenue forecasting.',
      'Prices, taxes, and billing terms may vary by region and may be updated from time to time. If there is a conflict between the website copy and Paddle checkout, the checkout terms control the transaction.',
    ],
  },
  {
    title: '5. Free Trial',
    body: [
      'Pro and Growth plans may include a 7-day free trial. Trial eligibility, if available, is shown at checkout or in-app. At the end of the trial, billing begins automatically unless you cancel before the trial ends.',
      'You are responsible for reviewing trial dates and cancelling in time if you do not wish to continue with a paid subscription.',
    ],
  },
  {
    title: '6. Cancellation and Refunds',
    body: [
      'You may cancel your subscription at any time from your account or through the billing process. Cancellation stops future recurring charges but does not automatically refund prior charges.',
      'Refund eligibility is governed by our Refund Policy. Please review the Refund Policy page for the most up-to-date refund rules and request instructions.',
    ],
  },
  {
    title: '7. Acceptable Use Policy',
    body: [
      'You agree not to misuse the service, including by sending spam, abusive, deceptive, unlawful, or harassing messages; attempting to bypass usage limits; reverse engineering the platform; or using the AI reminder system in ways that violate applicable law.',
      'We may suspend or terminate access if we reasonably believe your use of the service creates risk, violates these Terms, or harms other users, recipients, or the platform.',
    ],
  },
  {
    title: '8. Intellectual Property',
    body: [
      'PayFlow AI, including its design, software, workflows, branding, and documentation, is protected by intellectual property laws. We retain all rights not expressly granted to you.',
      'You retain ownership of the content you upload or create in your account, but you grant us the limited rights necessary to store, process, display, and deliver that content as part of the service.',
    ],
  },
  {
    title: '9. Limitation of Liability',
    body: [
      'To the fullest extent permitted by law, PayFlow AI will not be liable for indirect, incidental, special, consequential, or punitive damages, including lost profits, lost revenue, or lost data.',
      'Our total liability for any claim relating to the service will not exceed the amount you paid to PayFlow AI in the twelve months preceding the event giving rise to the claim.',
    ],
  },
  {
    title: '10. Indemnification',
    body: [
      'You agree to indemnify and hold PayFlow AI harmless from claims, damages, losses, liabilities, and expenses arising out of your use of the service, your content, your clients, or your violation of these Terms or applicable law.',
    ],
  },
  {
    title: '11. Changes to Terms',
    body: [
      'We may update these Terms from time to time to reflect product changes, legal requirements, or operational needs. If we make material changes, we will update the last updated date on this page.',
      'Your continued use of the service after changes become effective means you accept the revised Terms.',
    ],
  },
  {
    title: '12. Governing Law',
    body: [
      'These Terms are governed by the laws of India, without regard to conflict of law principles. Any dispute arising out of or relating to these Terms will be subject to the exclusive jurisdiction of the courts in Karnataka, India.',
    ],
  },
  {
    title: '13. Contact',
    body: ['For legal questions about these Terms, please contact legal@payflowai.com.'],
  },
];

export function Terms() {
  return (
    <LegalPageLayout
      icon={FileText}
      label="Legal"
      title="Terms of Service"
      lastUpdated="April 8, 2026"
      intro="These Terms are written to clearly explain how PayFlow AI works, what users can expect from the service, and how subscriptions, billing, and acceptable use are handled."
      sections={sections}
    />
  );
}
