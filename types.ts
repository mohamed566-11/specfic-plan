export type Language = 'ar' | 'en';

export interface StepTranslation {
  title: string;
  fields: Record<string, string>;
  placeholders?: Record<string, string>;
  options?: Record<string, string[]>;
}

export interface Translation {
  title: string;
  description: string;
  steps: StepTranslation[];
  form: {
    next: string;
    previous: string;
    submit: string;
    submitting: string;
    required: string;
    optional: string;
    successTitle: string;
    successMessage: string;
    errorSubmitting: string;
    errorUnexpected: string;
    errorUploading: string;
    uploading: string;
    fileReady: string;
    uploadButtonText: string;
    uploadHelp: string;
    stepOf: string;
    addMore: string;
    other: string;
  };
  footer: {
    servicesTitle: string;
    branchesTitle: string;
    companyTitle: string;
    companyDescription: string;
    copyright: string;
    services: string[];
    branches: string[];
  };
}

export interface FormState {
  // Step 1: Company Data
  companyName: string;
  sector: string;
  foundedYear: string;
  countryCity: string;
  website: string;
  branchCount: string;
  employeeCount: string;
  applicantName: string;
  jobTitle: string;
  mobile: string;
  email: string;

  // Step 2: Reason for Request
  requestReasons: string[];
  otherRequestReason: string;
  challengeDescription: string;

  // Step 3: Current Situation
  challenges: [string, string, string];
  strengths: [string, string, string];

  // Step 4: Scope
  scopeOptions: string[];
  otherScopeOption: string;

  // Step 5: Markets & Clients
  currentClients: string;
  clientSegments: string;
  currentRegions: string;
  targetMarkets: string;
  competitors: [string, string, string];

  // Step 6: Performance
  annualRevenue: string;
  growthRate: string;
  profitMargin: string;

  // Step 7: Expected Outputs
  expectedOutputs: string[];
  otherExpectedOutput: string;

  // Step 8: Timeline
  proposedStartDate: string;
  urgency: string;

  // Step 9: Attachments
  attachmentTypes: string[];
  files: File[];
}