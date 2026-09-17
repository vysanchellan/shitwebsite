/**
 * Supported insurance providers.
 *
 * PROTOTYPE RULE (spec §6): only providers genuinely configured and approved in the
 * backend may be presented as real RiskSense partners. Every entry below is
 * demonstration data for the academic prototype and is labelled as such in the UI.
 * Set `demo: false` only for providers actually approved in the backend.
 */
export type Insurer = {
  id: string;
  name: string;
  /** Short mark used to render the placeholder logo. */
  mark: string;
  /** Provider-plan descriptor shown under the name. */
  plan: string;
  /** Brand hue used for the generated logo lockup. */
  hue: string;
  /** Demonstration data — not a commercial partnership. */
  demo: boolean;
  /** Disabled providers stay in the data set but are dimmed and unselectable. */
  enabled: boolean;
};

export const INSURERS: Insurer[] = [
  { id: 'aurora',   name: 'Aurora Health Cover', mark: 'AH', plan: 'National · Tier 1–3', hue: '#4fd1e0', demo: true, enabled: true },
  { id: 'meridian', name: 'Meridian Assurance',  mark: 'MA', plan: 'National · Family',   hue: '#7aa2ff', demo: true, enabled: true },
  { id: 'northbay', name: 'Northbay Mutual',     mark: 'NB', plan: 'Regional · Standard', hue: '#5ee6b8', demo: true, enabled: true },
  { id: 'caldera',  name: 'Caldera Care Group',  mark: 'CC', plan: 'Employer · Group',    hue: '#f3b95f', demo: true, enabled: true },
  { id: 'veritas',  name: 'Veritas Health',      mark: 'VH', plan: 'National · Premium',  hue: '#c39cff', demo: true, enabled: true },
  { id: 'saltway',  name: 'Saltway Benefit Co.', mark: 'SB', plan: 'Employer · Core',     hue: '#ff9c8a', demo: true, enabled: true },
  { id: 'kestrel',  name: 'Kestrel Provident',   mark: 'KP', plan: 'Regional · Essential',hue: '#9fe870', demo: true, enabled: true },
  { id: 'orbis',    name: 'Orbis Life & Health', mark: 'OL', plan: 'National · Plus',     hue: '#63b3ff', demo: true, enabled: false },
];

export const INSURER_NOTE =
  'Eligibility is confirmed during registration. No member or policy information is displayed on the public site.';
