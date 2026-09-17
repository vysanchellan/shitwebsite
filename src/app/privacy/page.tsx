import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description:
    'How RiskSense AI handles patient information: what the website touches, what stays in the mobile application, and what is never stored.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      kicker="Privacy notice"
      title="What this website touches, and what it never does."
      standfirst="The RiskSense website has a narrow job: inform, show supported insurers, and complete access activation. It is deliberately not a second patient dashboard, and it holds far less about you than you might expect."
      updated="17 September 2026"
      sections={[
        {
          heading: 'The short version',
          list: [
            'Health data — vitals, laboratory values, risk analyses and prediction history — lives in the mobile application and the backend, not on this website.',
            'Card numbers and CVV are never persisted by RiskSense. In this prototype no real payment is processed at all.',
            'Insurance member details are masked wherever they are displayed back to you.',
            'The public pages do not require an account and do not ask for health information.',
          ],
        },
        {
          heading: 'Information handled during access activation',
          paragraphs: [
            'When the mobile application hands you to this website, it uses a short-lived secure registration token. Sensitive patient information is not placed in the URL.',
            'To complete activation the website handles your chosen access method, the insurance provider and membership details you supply if you choose that route, and the RiskSense Clinician ID you enter. These are passed to the RiskSense backend, which is the authoritative record.',
          ],
        },
        {
          heading: 'Payment information',
          paragraphs: [
            'The subscription step in this prototype uses a demonstration payment gateway. No real payment is processed. The card fields exist to demonstrate the interface, the form accepts only a published test card, and the card number and CVV are discarded as soon as the demo completes. Only the last four digits are shown back to you on the review step.',
          ],
        },
        {
          heading: 'Insurance information',
          paragraphs: [
            'If you activate through insurance, RiskSense handles the provider you select and the policy or membership details required to confirm eligibility. Verification is simulated in this prototype until a real insurer integration exists.',
            'The public insurer list never exposes member information. Selecting an insurer on the landing page only explains how eligibility is confirmed during registration.',
          ],
        },
        {
          heading: 'Clinician relationships',
          paragraphs: [
            'The Clinician ID you supply is verified against approved clinicians by the backend. On success you are shown only the minimum clinician detail needed to confirm you have the right person. An invalid or unapproved identifier creates no relationship at all.',
            'What a connected clinician can see is governed by role-based access control on the backend, not by anything on this website.',
          ],
        },
        {
          heading: 'Security',
          list: [
            'Zero-trust principles: every protected request is authenticated and authorised at the backend regardless of where it came from.',
            'Role-based access control separating patient, clinician and administrator permissions.',
            'Secure authenticated sessions with backend authorisation.',
            'Audit logging for sensitive system activity.',
            'Infrastructure secrets, database configuration and internal security keys are never exposed on the public website.',
          ],
        },
        {
          heading: 'The interactive district',
          paragraphs: [
            'The 3D district at /world runs entirely in your browser. It reads no health information, requires no account, and sends nothing anywhere. Your progress through it is held in memory for the length of your visit and then discarded.',
          ],
        },
        {
          heading: 'Contacting support',
          paragraphs: [
            'The contact action opens your own email application with a subject already filled in. It does not attach or transmit any patient or medical information, and RiskSense will never ask you to include health details, identifiers or test results in a support email.',
          ],
        },
        {
          heading: 'Prototype status',
          paragraphs: [
            'This deployment is an academic prototype. Insurers shown are demonstration data and do not represent commercial partnerships. Treat this notice as a description of the intended design rather than of a live production service.',
          ],
        },
      ]}
    />
  );
}
