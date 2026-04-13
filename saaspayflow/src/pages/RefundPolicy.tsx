import { RefreshCcw } from 'lucide-react';
import { LegalPageLayout } from '@/components/LegalPageLayout';

const sections = [
  {
    title: '1. Free Plan',
    body: ['The Free plan is available at no charge. You can cancel it at any time, and no refund is required because there is no paid charge associated with the plan.'],
  },
  {
    title: '2. Paid Plans',
    body: [
      'For Pro and Growth subscriptions, we offer a 14-day money-back guarantee measured from the date of the first charge. If you are not satisfied, you may request a refund during that period.',
      'The money-back guarantee applies to the first paid charge only, unless otherwise required by law or explicitly stated in a promotion or checkout flow.',
    ],
  },
  {
    title: '3. How to Request a Refund',
    body: [
      'To request a refund, email billing@payflowai.com within 14 days of the first charge. Use the subject line "Refund Request - [your account email]" and include the account email associated with your subscription.',
      'Please include a short explanation of the reason for your request so we can review it quickly and accurately.',
    ],
  },
  {
    title: '4. Processing Time',
    body: ['Approved refunds are processed within 5 to 10 business days and are returned to the original payment method whenever possible. Timing may vary depending on your bank or card issuer.'],
  },
  {
    title: '5. Exceptions',
    body: ['Refunds are not available after the 14-day guarantee window has passed. Refunds may also be denied if we determine the account has been used in violation of our Terms of Service, including abuse, fraud, spam, or unauthorized access attempts.'],
  },
  {
    title: '6. Subscription Cancellation',
    body: ['Cancelling your subscription stops future recurring charges. Cancellation does not automatically trigger a refund, and partial-month refunds are not provided unless required by law or approved under this policy.'],
  },
  {
    title: '7. Contact',
    body: ['For billing and refund questions, please contact billing@payflowai.com.'],
  },
];

export function RefundPolicy() {
  return (
    <LegalPageLayout
      icon={RefreshCcw}
      label="Legal"
      title="Refund Policy"
      lastUpdated="April 8, 2026"
      intro="This refund policy is designed to be simple and clear for customers and merchant review. If you have a billing issue, please contact us promptly so we can help."
      sections={sections}
    />
  );
}
