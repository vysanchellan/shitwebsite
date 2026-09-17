import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms covering use of the RiskSense AI website and the activation of RiskSense patient access.',
};

export default function TermsPage() {
  return (
    <LegalPage
      kicker="Terms of service"
      title="The terms, in language you can actually read."
      standfirst="These terms cover this website and the activation of RiskSense access. The mobile application and the RiskSense backend are governed by the same agreement."
      updated="17 September 2026"
      sections={[
        {
          heading: 'What you are agreeing to',
          paragraphs: [
            'By completing access setup on this website you agree to these terms, to the Privacy Notice, and to the Medical Disclaimer. If you do not accept them, do not activate access.',
            'The Medical Disclaimer is not boilerplate. It sets the limits of what RiskSense output means, and it takes precedence over any other description of the service.',
          ],
        },
        {
          heading: 'What the service is',
          paragraphs: [
            'RiskSense AI applies machine-learning models to health information you provide in order to produce decision-support risk estimates for heart disease and for diabetes, using the adult Diabetes v1 model.',
            'RiskSense is a decision-support and awareness tool. It does not diagnose disease, does not replace professional medical advice, and is not a substitute for clinical examination or testing.',
          ],
        },
        {
          heading: 'Access and eligibility',
          list: [
            'You must complete access activation — a subscription or a supported insurance provider — before full patient access is granted.',
            'You must supply a valid RiskSense Clinician ID for an approved clinician, whichever access method you choose.',
            'Diabetes v1 is an adult model; eligibility is checked before an analysis runs.',
            'Access is personal to you and must not be shared.',
          ],
        },
        {
          heading: 'Your responsibilities',
          list: [
            'Provide accurate health information. The quality of an estimate depends entirely on what has been recorded.',
            'Keep your account credentials and your device secure.',
            'Discuss results with your connected clinician rather than acting on them alone.',
            'Do not use RiskSense to make emergency care decisions.',
          ],
        },
        {
          heading: 'Payment and insurance',
          paragraphs: [
            'In this academic prototype the payment gateway is a demonstration environment. No real payment is processed, no card details are stored, and insurance verification is simulated until a real insurer integration exists.',
            'The insurers presented are demonstration data. Their appearance does not imply any commercial partnership, endorsement or coverage arrangement.',
          ],
        },
        {
          heading: 'Clinician relationships',
          paragraphs: [
            'RiskSense verifies that a supplied Clinician ID belongs to an eligible, approved clinician before confirming a relationship. RiskSense does not employ, supervise or direct clinicians, and is not responsible for the clinical advice they give.',
          ],
        },
        {
          heading: 'Availability',
          paragraphs: [
            'RiskSense may be unavailable from time to time for maintenance, or because of faults outside our control. Where activation fails, the service will tell you what happened in plain language and offer a way forward rather than surfacing a technical error.',
          ],
        },
        {
          heading: 'Limitation of liability',
          paragraphs: [
            'To the fullest extent permitted by law, RiskSense is not liable for decisions taken on the basis of a risk estimate without clinical review, for inaccuracies arising from information you supplied, or for any consequence of using the service as a substitute for professional medical advice.',
            'Nothing in these terms limits liability that cannot lawfully be limited.',
          ],
        },
        {
          heading: 'Changes',
          paragraphs: [
            'These terms may be updated as the service develops. Material changes will be communicated before they take effect, and the date at the top of this page will change.',
          ],
        },
      ]}
    />
  );
}
