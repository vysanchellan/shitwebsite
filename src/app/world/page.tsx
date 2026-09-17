import type { Metadata } from 'next';
import { WorldClient } from '@/components/world/WorldClient';

export const metadata: Metadata = {
  title: 'The District',
  description:
    'Walk the RiskSense District: an interactive 3D city where every building explains one part of the RiskSense AI service — the risk models, the clinician link, insurance activation and security.',
};

export default function WorldPage() {
  return <WorldClient />;
}
