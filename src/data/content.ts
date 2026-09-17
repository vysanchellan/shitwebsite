/**
 * RiskSense AI — content model.
 *
 * Every piece of information in the design specification lives here once, and is
 * rendered twice: as an interactable in the 3D world (/world) and as a plain
 * document (/overview). The world is the experience; the document is the fallback
 * for small screens, no-WebGL devices and assistive technology.
 */

export type Accent = 'aether' | 'azure' | 'verdant' | 'jade' | 'amber' | 'ember' | 'plum';

export type Bullet = { label: string; text: string };

export type InfoNode = {
  id: string;
  /** World district this node belongs to. */
  district: string;
  /** Short label used on the marker and in the HUD log. */
  label: string;
  /** Number badge shown on sequenced nodes (the six-step journey). */
  step?: number;
  title: string;
  kicker: string;
  body: string[];
  bullets?: Bullet[];
  /** Small print rendered under the panel — sources, disclaimers, prototype notes. */
  footnote?: string;
  accent: Accent;
  /** Position of the interactable in world space [x, y, z]. */
  position: [number, number, number];
  /** Optional call to action rendered at the bottom of the panel. */
  cta?: { label: string; href: string };
};

export const SUPPORT_EMAIL = 'support@risksense.ai';

export const HERO = {
  eyebrow: 'Decision-support risk intelligence',
  headline: ['Know your risk', 'before it becomes', 'your reality.'],
  standfirst:
    'RiskSense AI combines a patient’s health information with machine-learning models to produce decision-support risk estimates for heart disease and diabetes, reviewed with the clinician who already knows them.',
  badges: [
    'AI-Assisted Risk Analysis',
    'Zero-Trust Security',
    'Clinician Connected',
    'Health Monitoring',
  ],
  disclaimer:
    'RiskSense AI provides risk estimates for decision support and awareness. It does not provide a medical diagnosis and does not replace professional medical advice.',
};

/** Statistics rendered on the landing page and on the obelisks in Awareness Park. */
export const STATISTICS = [
  {
    value: '17.9M',
    unit: 'deaths a year',
    claim:
      'Cardiovascular disease is the leading cause of death worldwide, accounting for an estimated 32% of all global deaths.',
    source: 'World Health Organization — Cardiovascular diseases fact sheet',
    year: '2021',
  },
  {
    value: '1 in 2',
    unit: 'adults undiagnosed',
    claim:
      'Of the 537 million adults living with diabetes, roughly 240 million do not know they have it.',
    source: 'International Diabetes Federation — IDF Diabetes Atlas, 10th edition',
    year: '2021',
  },
  {
    value: '96M',
    unit: 'US adults',
    claim: 'Have prediabetes. More than 8 in 10 of them are unaware of it.',
    source: 'Centers for Disease Control and Prevention — National Diabetes Statistics Report',
    year: '2022',
  },
  {
    value: '3 in 4',
    unit: 'CVD deaths',
    claim:
      'Occur in low- and middle-income countries, where earlier detection programmes are least available.',
    source: 'World Health Organization — Cardiovascular diseases fact sheet',
    year: '2021',
  },
];

export const STATISTICS_NOTE =
  'Figures are quoted from the cited publications and carry their source and year. They are not modelled, extrapolated or produced by RiskSense AI. Confirm against the current edition of each source before publication.';

export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '/overview#journey' },
  { label: 'Risk Analysis', href: '/overview#analysis' },
  { label: 'Insurance Partners', href: '/overview#insurance' },
  { label: 'Security', href: '/overview#security' },
  { label: 'FAQ', href: '/overview#faq' },
  { label: 'Contact', href: '/overview#contact' },
];

/* -------------------------------------------------------------------------- */
/* The world                                                                   */
/* -------------------------------------------------------------------------- */

export const NODES: InfoNode[] = [
  {
    id: 'arrival',
    district: 'Arrival Gate',
    label: 'Arrival',
    title: 'Welcome to the RiskSense District',
    kicker: 'Start here',
    accent: 'aether',
    position: [-55.4, 0, -39.6],
    body: [
      'This district is the RiskSense AI service, laid out as a place you can walk through. Every building holds one part of the system: what it analyses, who reviews it, how access is granted, how the data is protected.',
      'The website is the public information and service-activation layer. The mobile application remains the primary patient health application: health profile, vitals, laboratory information and risk-analysis history all live there.',
    ],
    bullets: [
      { label: 'Move', text: 'W A S D or arrow keys. Hold Shift to sprint' },
      { label: 'Look', text: 'Move the mouse. Click once to capture the cursor' },
      { label: 'Interact', text: 'Walk into a marker and press E' },
      { label: 'Map', text: 'Press M for the district map. Esc releases the cursor' },
    ],
    footnote:
      'On a touch device, use the left stick to walk, drag the right side of the screen to look, and tap the pulsing marker to read it.',
  },

  /* --- Journey Boulevard : section 5.4 How RiskSense Works --------------- */
  {
    id: 'journey-1',
    district: 'Journey Boulevard',
    label: 'Create Profile',
    step: 1,
    title: 'Create Profile',
    kicker: 'In the mobile application',
    accent: 'azure',
    position: [-32.8, 0, -39.6],
    body: [
      'The patient creates their RiskSense account and basic profile inside the mobile application. This establishes identity against the backend, but it does not yet grant access to risk analysis.',
    ],
  },
  {
    id: 'journey-2',
    district: 'Journey Boulevard',
    label: 'Connect Clinician',
    step: 2,
    title: 'Connect Clinician',
    kicker: 'Mandatory for every patient',
    accent: 'azure',
    position: [-17.6, 0, -39.6],
    body: [
      'The patient supplies the unique RiskSense Clinician ID given to them by their clinician. The backend verifies that the identifier belongs to an eligible, approved clinician before the relationship is confirmed.',
    ],
  },
  {
    id: 'journey-3',
    district: 'Journey Boulevard',
    label: 'Activate Access',
    step: 3,
    title: 'Activate Access',
    kicker: 'Completed on this website',
    accent: 'azure',
    position: [-20, 0, -31.1],
    body: [
      'The patient chooses a RiskSense subscription or a supported insurance provider, completes verification and activates the service. Full patient access is granted only once the clinician connection and access activation are both complete.',
    ],
  },
  {
    id: 'journey-4',
    district: 'Journey Boulevard',
    label: 'Add Health Info',
    step: 4,
    title: 'Add Health Information',
    kicker: 'Back in the mobile application',
    accent: 'azure',
    position: [-20, 0, -13.4],
    body: [
      'The patient records the health information the supported models require: demographics, vitals, and the relevant laboratory values.',
    ],
  },
  {
    id: 'journey-5',
    district: 'Journey Boulevard',
    label: 'Run Risk Analysis',
    step: 5,
    title: 'Run Risk Analysis',
    kicker: 'Model inference on the backend',
    accent: 'azure',
    position: [-20, 0, 28.6],
    body: [
      'The FastAPI backend runs the supported risk-analysis model against the patient’s current information and returns an estimate. Inference is authoritative on the backend, never on the device or in the browser.',
    ],
  },
  {
    id: 'journey-6',
    district: 'Journey Boulevard',
    label: 'Review Results',
    step: 6,
    title: 'Review Results',
    kicker: 'With a clinician',
    accent: 'azure',
    position: [-20, 0, 45.4],
    body: [
      'Results are presented in language the patient can understand, alongside the factors that contributed to them, so the estimate can support a conversation with their connected clinician.',
    ],
    footnote:
      'A risk estimate is a prompt to talk to a clinician, not a conclusion about a patient’s health.',
  },

  /* --- Awareness Park : section 5.2 -------------------------------------- */
  {
    id: 'awareness',
    district: 'Awareness Park',
    label: 'Why Earlier Matters',
    title: 'Why earlier awareness matters',
    kicker: 'Awareness Park',
    accent: 'amber',
    position: [72.4, 0, -5],
    body: [
      'Heart disease and diabetes are both conditions where risk accumulates quietly and where earlier awareness changes what can be done about it. The obelisks in this park each carry one published figure, with its source and year.',
      'RiskSense does not generate these numbers and does not estimate late-detection rates of its own. They are quoted, attributed and dated so that anyone reading them can go and check them.',
    ],
    footnote: STATISTICS_NOTE,
  },

  /* --- The Problem : section 5.3 ---------------------------------------- */
  {
    id: 'problem-silent',
    district: 'The Problem',
    label: 'Silent Risk',
    title: 'Risk factors go unnoticed',
    kicker: 'The problem · 01',
    accent: 'ember',
    position: [-57.3, 0, 39.5],
    body: [
      'Raised blood pressure, raised cholesterol and impaired fasting glucose rarely announce themselves. A patient can carry several of them for years and feel entirely well.',
    ],
  },
  {
    id: 'problem-fragmented',
    district: 'The Problem',
    label: 'Fragmented Data',
    title: 'Health information is fragmented',
    kicker: 'The problem · 02',
    accent: 'ember',
    position: [17.6, 0, 17.8],
    body: [
      'A blood pressure reading sits in one place, a lipid panel in another, a weight measurement in a third. Nothing assembles them into a single picture at the moment a decision is being made.',
    ],
  },
  {
    id: 'problem-delayed',
    district: 'The Problem',
    label: 'Delayed Action',
    title: 'Action arrives late',
    kicker: 'The problem · 03',
    accent: 'ember',
    position: [35.3, 0, 17.8],
    body: [
      'Without a prompt, the conversation with a clinician happens after symptoms appear rather than during the window where risk can still be modified.',
    ],
  },
  {
    id: 'response',
    district: 'Central Plaza',
    label: 'The Response',
    title: 'The RiskSense response',
    kicker: 'Central Plaza',
    accent: 'aether',
    position: [-55.6, 0, -37],
    body: ['RiskSense answers those three problems with three deliberate moves.'],
    bullets: [
      { label: 'Consolidate', text: 'Bring the relevant health information into one structured profile.' },
      { label: 'Analyse', text: 'Run the supported risk-analysis models against that profile on the backend.' },
      { label: 'Explain', text: 'Present a result a patient can understand and a clinician can act on.' },
    ],
  },

  /* --- Risk analysis : section 5.5 --------------------------------------- */
  {
    id: 'heart-model',
    district: 'Cardiac Institute',
    label: 'Heart Disease Model',
    title: 'Heart Disease risk analysis',
    kicker: 'Supported model',
    accent: 'ember',
    position: [55.6, 0, -12.6],
    body: [
      'The heart disease model produces a decision-support estimate of cardiovascular risk from a small set of established clinical inputs. Each input is a value a clinician already recognises, which is what makes the output discussable.',
    ],
    bullets: [
      { label: 'Age', text: 'Years' },
      { label: 'Sex', text: 'As recorded on the health profile' },
      { label: 'Systolic blood pressure', text: 'mmHg' },
      { label: 'Total cholesterol', text: 'Laboratory value' },
      { label: 'Fasting glucose status', text: 'Above or below the configured threshold' },
    ],
    footnote: 'Example inputs. The authoritative input schema is held by the FastAPI backend.',
  },
  {
    id: 'diabetes-model',
    district: 'Metabolic Lab',
    label: 'Diabetes v1 Model',
    title: 'Diabetes v1 risk analysis',
    kicker: 'Supported model · adults',
    accent: 'verdant',
    position: [49.7, 0, 43.7],
    body: [
      'Diabetes v1 is an adult risk model. It reads anthropometric and blood-pressure measurements that can be captured without a laboratory, which makes it usable earlier in a patient’s journey.',
    ],
    bullets: [
      { label: 'Age', text: 'Years. Adult eligibility applies' },
      { label: 'Sex', text: 'As recorded on the health profile' },
      { label: 'BMI', text: 'kg/m²' },
      { label: 'Waist circumference', text: 'cm' },
      { label: 'Systolic blood pressure', text: 'mmHg' },
      { label: 'Diastolic blood pressure', text: 'mmHg' },
    ],
    footnote:
      'Diabetes v1 is validated for adults. Example inputs; the authoritative schema is held by the backend.',
  },
  {
    id: 'disclaimer',
    district: 'Central Plaza',
    label: 'Medical Disclaimer',
    title: 'Medical disclaimer',
    kicker: 'Read this one',
    accent: 'amber',
    position: [55.6, 0, -28.6],
    body: [
      'RiskSense AI provides risk estimates for decision support and awareness. It does not provide a medical diagnosis and it does not replace professional medical advice.',
      'A risk estimate describes a probability across a population with similar characteristics. It does not tell a patient what will happen to them, and it must never be used to start, stop or change treatment without a clinician.',
    ],
    cta: { label: 'Read the full disclaimer', href: '/medical-disclaimer' },
  },

  /* --- Insurance : section 6 -------------------------------------------- */
  {
    id: 'insurance',
    district: 'Insurance Pavilion',
    label: 'Insurance Partners',
    title: 'Use your supported insurance cover with RiskSense',
    kicker: 'Insurance Pavilion',
    accent: 'plum',
    position: [25.2, 0, -1],
    body: [
      'Patients can activate RiskSense access through a supported insurance provider instead of a subscription. The kiosks around this pavilion show which providers can be selected during registration and access verification.',
      'The provider list is data-driven: providers can be added, disabled or reordered in the backend without redesigning anything. Selecting a provider explains how eligibility works. It never exposes member information.',
    ],
    footnote:
      'Every provider shown in this prototype is demonstration data, clearly labelled as such. No commercial partnership is implied. Insurance verification is simulated until a real insurer integration exists.',
  },

  /* --- Clinician : section 7.1 ------------------------------------------ */
  {
    id: 'clinician',
    district: 'Clinician Link',
    label: 'Clinician Connection',
    title: 'RiskSense complements the clinician',
    kicker: 'Clinician Link',
    accent: 'jade',
    position: [-55.6, 0, -11.8],
    body: [
      'RiskSense is built to end in a conversation, not to replace one. Every patient supplies the unique RiskSense Clinician ID issued by their clinician during service activation.',
      'The backend verifies that the identifier belongs to an eligible, approved clinician before confirming the relationship. On success the patient sees only the minimum clinician detail needed to confirm they picked the right person. An invalid or unapproved ID produces a clear correction message and creates no relationship at all.',
    ],
  },

  /* --- Security : section 7.2 ------------------------------------------- */
  {
    id: 'security',
    district: 'Security Vault',
    label: 'Security',
    title: 'Zero-trust by default',
    kicker: 'Security Vault',
    accent: 'verdant',
    position: [-55.6, 0, 13.4],
    body: [
      'Protected requests are never trusted on the strength of where they came from. Every one is authenticated and authorised at the backend.',
    ],
    bullets: [
      { label: 'Zero-trust', text: 'Every protected request is verified, regardless of origin.' },
      { label: 'RBAC', text: 'Patient, clinician and administrator permissions are separated.' },
      { label: 'Sessions', text: 'Secure authenticated sessions with backend authorisation.' },
      { label: 'Audit logging', text: 'Sensitive system activity is recorded.' },
    ],
    footnote:
      'Infrastructure secrets, database configuration and internal security keys are never exposed on the public website, including in this world.',
  },

  /* --- Architecture and boundaries : sections 2 and 13 ------------------- */
  {
    id: 'boundaries',
    district: 'Central Plaza',
    label: 'System Boundaries',
    title: 'Three systems, one source of truth',
    kicker: 'Architecture',
    accent: 'azure',
    position: [64.7, 0, 17.8],
    body: [
      'The website and the mobile application share one backend as the authoritative source for authentication, subscriptions, insurance verification, clinician relationships, entitlements and access state.',
    ],
    bullets: [
      {
        label: 'Website',
        text: 'Public information, health awareness, supported-insurer display, registration completion, subscription or insurance selection, clinician linking, legal and support information.',
      },
      {
        label: 'Mobile app',
        text: 'The ongoing patient experience: health profile, vitals and labs, risk analyses, prediction history.',
      },
      {
        label: 'FastAPI backend',
        text: 'Identity, RBAC, model inference, clinician relationships, subscriptions, insurance, entitlements, persistence and audit logging.',
      },
    ],
    footnote: 'The website is deliberately not a second patient dashboard.',
  },

  /* --- Registration handoff : section 8 --------------------------------- */
  {
    id: 'handoff',
    district: 'Insurance Pavilion',
    label: 'Registration Handoff',
    title: 'How the app hands over to the website',
    kicker: 'Activation flow',
    accent: 'plum',
    position: [48.7, 0, 17.8],
    body: [
      'Registration begins in the mobile application. After the account and basic profile stage, the app redirects the patient to this website to complete access setup.',
      'The handoff uses a short-lived secure registration token. Sensitive patient information is never placed in the URL. After activation the website returns the patient to the app through a deep link, and the app re-checks entitlement with the backend rather than trusting the browser screen.',
    ],
    bullets: [
      {
        label: 'Sequence',
        text: 'Mobile registration → website welcome → access method → subscription or insurance → clinician verification → review → activate → return to app.',
      },
    ],
  },

  /* --- Failure states : section 9 --------------------------------------- */
  {
    id: 'recovery',
    district: 'Insurance Pavilion',
    label: 'When Things Fail',
    title: 'Failure and recovery',
    kicker: 'Error handling',
    accent: 'amber',
    position: [58, 0, -36.3],
    body: [
      'Activation can fail for ordinary reasons. Each one gets plain user-facing language and a way forward, Try Again or Return to App, never a raw API error.',
    ],
    bullets: [
      { label: 'Payment', text: 'Demo payment failed or was cancelled.' },
      { label: 'Insurance', text: 'Insurance verification failed.' },
      { label: 'Clinician', text: 'Clinician ID invalid, or clinician not approved.' },
      { label: 'Session', text: 'Registration link expired.' },
      { label: 'Backend', text: 'Network or backend temporarily unavailable.' },
      { label: 'State', text: 'Account already activated, or required information incomplete.' },
    ],
  },

  /* --- FAQ and contact : section 10 ------------------------------------- */
  {
    id: 'faq',
    district: 'Information Kiosk',
    label: 'FAQ',
    title: 'Frequently asked',
    kicker: 'Information Kiosk',
    accent: 'aether',
    position: [-50.4, 0, 40.5],
    body: ['The questions patients actually ask, answered without hedging.'],
    bullets: [
      { label: 'Does it diagnose?', text: 'No. RiskSense produces decision-support risk estimates, not diagnoses.' },
      { label: 'What is supported?', text: 'Heart disease, and the adult Diabetes v1 risk model.' },
      {
        label: 'Why a Clinician ID?',
        text: 'So every result has a qualified person to review it. It is mandatory for both access methods.',
      },
      {
        label: 'What can my clinician see?',
        text: 'Only what the confirmed relationship and their role permit under RBAC.',
      },
      {
        label: 'Am I eligible for Diabetes v1?',
        text: 'Diabetes v1 is an adult model. Eligibility is checked before analysis runs.',
      },
      {
        label: 'How do I read model performance?',
        text: 'Performance figures describe accuracy across a population, not certainty about one patient.',
      },
    ],
    cta: { label: 'Full FAQ', href: '/overview#faq' },
  },
  {
    id: 'contact',
    district: 'Information Kiosk',
    label: 'Contact',
    title: 'Talk to the team',
    kicker: 'Support',
    accent: 'jade',
    position: [-36.1, 0, 34.6],
    body: [
      'Support opens in your own email application with the subject already filled in.',
      'Please do not include medical details, identifiers or test results in a support email. RiskSense never asks for them there.',
    ],
    cta: {
      label: 'Email ' + SUPPORT_EMAIL,
      href:
        'mailto:' +
        SUPPORT_EMAIL +
        '?subject=RiskSense%20AI%20support%20request&body=Please%20describe%20your%20question.%20Do%20not%20include%20medical%20or%20personal%20health%20information.',
    },
  },

  /* --- Activation terminal : section 8 ---------------------------------- */
  {
    id: 'activation',
    district: 'Activation Terminal',
    label: 'Activate Access',
    title: 'Complete your access setup',
    kicker: 'Activation Terminal',
    accent: 'aether',
    position: [-8.0, 0, -28.0],
    body: [
      'This is where a patient arriving from the mobile application finishes registration: choose subscription or insurance, verify the clinician, review and activate.',
      'The demonstration runs the whole flow end to end with a clearly-labelled demo payment gateway. No real payment is processed and no card data is stored.',
    ],
    cta: { label: 'Open the activation flow', href: '/register/complete' },
  },
];

export const NODE_COUNT = NODES.length;

export const FAQ = (NODES.find((n) => n.id === 'faq')?.bullets ?? []).map((b) => ({
  q: b.label,
  a: b.text,
}));

export const DISTRICTS = Array.from(new Set(NODES.map((n) => n.district)));
