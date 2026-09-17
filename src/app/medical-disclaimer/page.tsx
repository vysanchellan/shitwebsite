import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Medical Disclaimer',
  description:
    'RiskSense AI provides decision-support risk estimates for heart disease and diabetes. It does not diagnose disease and does not replace professional medical advice.',
};

export default function MedicalDisclaimerPage() {
  return (
    <LegalPage
      kicker="Medical disclaimer"
      title="RiskSense does not diagnose."
      standfirst="This is the most important page on the site. If anything elsewhere reads as though RiskSense can tell you whether you have a condition, this page overrides it."
      updated="17 September 2026"
      sections={[
        {
          heading: 'What RiskSense provides',
          paragraphs: [
            'RiskSense AI produces risk estimates for decision support and awareness. An estimate describes how likely an outcome is across a population of people with similar recorded characteristics. It is a prompt for a conversation, not a finding about your body.',
            'RiskSense supports two analyses: a heart disease risk model, and the adult Diabetes v1 risk model. Anything outside those two is outside what RiskSense can speak to.',
          ],
        },
        {
          heading: 'What RiskSense does not provide',
          list: [
            'A medical diagnosis, of any condition, at any confidence level.',
            'A prediction of what will happen to you as an individual.',
            'A recommendation to start, stop, change or delay any treatment or medication.',
            'Emergency or urgent-care guidance.',
            'A substitute for examination, testing or professional clinical judgement.',
          ],
        },
        {
          heading: 'Why a clinician is mandatory',
          paragraphs: [
            'Every RiskSense patient connects a verified clinician before access is activated. That is a deliberate design decision, not an administrative step: a risk estimate handed to someone with no clinical context is at best confusing and at worst harmful.',
            'Discuss any result with your connected clinician, who can weigh it against your history, examination and any testing.',
          ],
        },
        {
          heading: 'How to read model performance',
          paragraphs: [
            'Where RiskSense reports model performance, those figures describe how well a model separates outcomes across a validation population. They do not describe how certain the model is about you. A model with strong population-level performance can still be wrong about an individual.',
            'Model inputs are also only as good as what has been recorded. Missing, stale or mistyped values change the estimate.',
          ],
        },
        {
          heading: 'Eligibility',
          paragraphs: [
            'Diabetes v1 is validated for adults. RiskSense checks eligibility before an analysis runs and will decline to produce an estimate rather than produce one it cannot stand behind.',
          ],
        },
        {
          heading: 'If you are worried about your health',
          paragraphs: [
            'Contact your clinician or your local health service. If you think you may be having a medical emergency — including chest pain, difficulty breathing, or symptoms of a stroke — call your local emergency number immediately. Do not wait for a RiskSense result, and do not use RiskSense to decide whether an emergency is real.',
          ],
        },
        {
          heading: 'Prototype status',
          paragraphs: [
            'This deployment is an academic prototype. The payment gateway is a demonstration, insurance verification is simulated, and the insurers shown are placeholder data. Nothing here should be treated as a live clinical service.',
          ],
        },
      ]}
    />
  );
}
