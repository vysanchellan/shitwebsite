import type { Metadata } from 'next';
import { RegisterFlow } from '@/components/register/RegisterFlow';

export const metadata: Metadata = {
  title: 'Complete your access setup',
  description:
    'Finish RiskSense AI registration: choose a subscription or a supported insurance provider, verify your clinician, review and activate.',
  robots: { index: false, follow: false },
};

export default function RegisterCompletePage() {
  return <RegisterFlow />;
}
