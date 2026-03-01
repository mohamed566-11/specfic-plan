import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Send, ChevronLeft, ChevronRight, Building2, Target, Eye, Compass, Users, Package, BarChart3, Wrench, UserCheck, ClipboardList, Clock, Paperclip, AlertCircle } from 'lucide-react';
import { TRANSLATIONS } from './constants';
import { Language, FormState } from './types';
import { LanguageToggle } from './components/LanguageToggle';
import { ProgressRobot } from './components/ProgressRobot';

// ─── API Configuration ──────────────────────────────
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}/specfic-plan/api`
  : '/api';

const TOTAL_STEPS = 9;

const STEP_ICONS = [
  Building2, Target, Eye, Compass, Compass, Users, Package, BarChart3, Wrench, UserCheck, ClipboardList, Clock, Paperclip
];

const initialFormState: FormState = {
  companyName: '', sector: '', foundedYear: '', countryCity: '', website: '', branchCount: '', employeeCount: '',
  applicantName: '', jobTitle: '', mobile: '', email: '',
  requestReasons: [], otherRequestReason: '', challengeDescription: '',
  challenges: ['', '', ''], strengths: ['', '', ''],
  scopeOptions: [], otherScopeOption: '',
  currentClients: '', clientSegments: '', currentRegions: '', targetMarkets: '', competitors: ['', '', ''],
  annualRevenue: '', growthRate: '', profitMargin: '',
  expectedOutputs: [], otherExpectedOutput: '',
  proposedStartDate: '', urgency: '',
  attachmentTypes: [], files: [],
};

// ─── Per-Step Required Fields Configuration ──────────
// Define which fields are REQUIRED in each step
// Fields not listed here are optional and user can proceed without filling them
interface StepValidation {
  requiredFields: string[];
  requiredArrayFields?: string[]; // for checkbox groups that must have at least one
}

const STEP_VALIDATIONS: StepValidation[] = [
  // Step 0: Company Data - companyName, applicantName, mobile are required
  {
    requiredFields: ['companyName', 'applicantName', 'mobile'],
  },
  // Step 1: Reason for Request - optional
  {
    requiredFields: [],
  },
  // Step 2: Current Situation - optional
  {
    requiredFields: [],
  },
  // Step 3: Scope - optional
  {
    requiredFields: [],
  },
  // Step 4: Markets & Clients - optional
  {
    requiredFields: [],
  },
  // Step 5: Performance - optional
  {
    requiredFields: [],
  },
  // Step 6: Expected Outputs - optional
  {
    requiredFields: [],
  },
  // Step 7: Timeline - optional
  {
    requiredFields: [],
  },
  // Step 8: Attachments - optional
  {
    requiredFields: [],
  },
];

// ─── Validation Error Messages ──────────────────────
const VALIDATION_MESSAGES: Record<string, Record<Language, string>> = {
  companyName: { ar: 'يرجى إدخال الاسم التجاري', en: 'Please enter the company name' },
  sector: { ar: 'يرجى إدخال القطاع/النشاط الرئيسي', en: 'Please enter the sector' },
  countryCity: { ar: 'يرجى إدخال الدولة/المدينة', en: 'Please enter the country/city' },
  applicantName: { ar: 'يرجى إدخال اسم مقدم الطلب', en: 'Please enter the applicant name' },
  mobile: { ar: 'يرجى إدخال رقم الجوال', en: 'Please enter the mobile number' },
  mobileFormat: { ar: 'رقم الجوال يجب أن يبدأ بـ 01 ويتكون من 11 رقم', en: 'Mobile must start with 01 and be 11 digits' },
  email: { ar: 'يرجى إدخال بريد إلكتروني صحيح', en: 'Please enter a valid email address' },
  requestReasons: { ar: 'يرجى اختيار هدف واحد على الأقل', en: 'Please select at least one objective' },
  scopeOptions: { ar: 'يرجى اختيار نطاق واحد على الأقل', en: 'Please select at least one scope option' },
  numericOnly: { ar: 'يرجى إدخال أرقام فقط', en: 'Please enter numbers only' },
};

// Egyptian mobile validation: starts with 01, exactly 11 digits
const isValidEgyptianMobile = (mobile: string): boolean => {
  if (!mobile) return false;
  return /^01[0-9]{9}$/.test(mobile.trim());
};

// Check if a string contains only numbers (allows empty)
const isNumericOnly = (value: string): boolean => {
  if (!value || value.trim() === '') return true;
  return /^[0-9]+$/.test(value.trim());
};

// Simple email validation
const isValidEmail = (email: string): boolean => {
  if (!email) return true; // empty is ok if not required
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
};

// ─── File to Base64 helper ──────────────────────────
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'ar';

  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const [stepTouched, setStepTouched] = useState<Set<number>>(new Set());

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [lang, isRTL]);

  const updateField = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    setFormState(prev => {
      const arr = [...(prev as any)[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const toggleCheckbox = (field: string, value: string) => {
    setFormState(prev => {
      const arr: string[] = [...(prev as any)[field]];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      return { ...prev, [field]: arr };
    });
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  // ─── Step Validation ──────────────────────────────
  const validateStep = (stepIndex: number): Record<string, string> => {
    const validation = STEP_VALIDATIONS[stepIndex];
    const stepErrors: Record<string, string> = {};

    if (!validation) return stepErrors;

    // Check required text fields
    for (const field of validation.requiredFields) {
      const value = (formState as any)[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        stepErrors[field] = VALIDATION_MESSAGES[field]?.[lang] || (lang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required');
      }
    }

    // Check required array fields (checkboxes - must have at least one selected)
    if (validation.requiredArrayFields) {
      for (const field of validation.requiredArrayFields) {
        const value = (formState as any)[field];
        if (!value || !Array.isArray(value) || value.length === 0) {
          stepErrors[field] = VALIDATION_MESSAGES[field]?.[lang] || (lang === 'ar' ? 'يرجى اختيار خيار واحد على الأقل' : 'Please select at least one option');
        }
      }
    }

    // ─── Step 0 specific validations ───────────────
    if (stepIndex === 0) {
      // Egyptian mobile: must start with 01 and be 11 digits
      if (formState.mobile && formState.mobile.trim() !== '' && !isValidEgyptianMobile(formState.mobile)) {
        stepErrors['mobile'] = VALIDATION_MESSAGES['mobileFormat'][lang];
      }

      // Email format (only if filled)
      if (formState.email && !isValidEmail(formState.email)) {
        stepErrors['email'] = VALIDATION_MESSAGES['email'][lang];
      }

      // Numeric-only fields: foundedYear, branchCount, employeeCount
      const numericFields = ['foundedYear', 'branchCount', 'employeeCount'];
      for (const field of numericFields) {
        const value = (formState as any)[field];
        if (value && !isNumericOnly(value)) {
          stepErrors[field] = VALIDATION_MESSAGES['numericOnly'][lang];
        }
      }
    }

    return stepErrors;
  };

  const goToStep = (direction: 'next' | 'prev') => {
    if (isAnimating) return;

    // Validate current step before going next
    if (direction === 'next') {
      const stepErrors = validateStep(currentStep);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setStepTouched(prev => new Set(prev).add(currentStep));
        // Scroll to first error
        setTimeout(() => {
          const firstErrorEl = document.querySelector('.border-red-300, .text-red-600');
          if (firstErrorEl) {
            firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
    }

    setSlideDirection(direction);
    setIsAnimating(true);
    setErrors({}); // Clear errors when navigating

    setTimeout(() => {
      if (direction === 'next' && currentStep < TOTAL_STEPS - 1) {
        setCurrentStep(prev => prev + 1);
      } else if (direction === 'prev' && currentStep > 0) {
        setCurrentStep(prev => prev - 1);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setIsAnimating(false), 400);
    }, 200);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFormState(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const removeFile = (index: number) => {
    setFormState(prev => {
      const files = [...prev.files];
      files.splice(index, 1);
      return { ...prev, files };
    });
  };

  // ─── Submit to MySQL via PHP API ──────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate current (last) step
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const fd = new FormData();

      // Mapping form fields to API fields
      const fieldMap: Record<string, any> = {
        company_name: formState.companyName,
        sector: formState.sector,
        founded_year: formState.foundedYear,
        country_city: formState.countryCity,
        website: formState.website,
        branch_count: formState.branchCount,
        employee_count: formState.employeeCount,
        applicant_name: formState.applicantName,
        job_title: formState.jobTitle,
        mobile: formState.mobile,
        email: formState.email,
        other_request_reason: formState.otherRequestReason,
        challenge_description: formState.challengeDescription,
        other_scope_option: formState.otherScopeOption,
        current_clients: formState.currentClients,
        client_segments: formState.clientSegments,
        current_regions: formState.currentRegions,
        target_markets: formState.targetMarkets,
        annual_revenue: formState.annualRevenue,
        growth_rate: formState.growthRate,
        profit_margin: formState.profitMargin,
        other_expected_output: formState.otherExpectedOutput,
        proposed_start_date: formState.proposedStartDate,
        urgency: formState.urgency,
      };

      // Text fields
      Object.keys(fieldMap).forEach(key => {
        fd.append(key, fieldMap[key] || '');
      });

      // Array fields
      const arrayFields: Record<string, any[]> = {
        request_reasons: formState.requestReasons,
        challenges: formState.challenges,
        strengths: formState.strengths,
        scope_options: formState.scopeOptions,
        competitors: formState.competitors,
        expected_outputs: formState.expectedOutputs,
        attachment_types: formState.attachmentTypes,
      };

      Object.keys(arrayFields).forEach(key => {
        fd.append(key, JSON.stringify(arrayFields[key] || []));
      });

      // Files
      if (formState.files && formState.files.length > 0) {
        setIsUploading(true);
        formState.files.forEach(file => {
          fd.append('files[]', file, file.name);
        });
      }

      const response = await fetch(`${API_BASE_URL}/submit.php`, {
        method: 'POST',
        body: fd,
      });

      setIsUploading(false);

      // Try to parse response as JSON
      let result;
      const responseText = await response.text();
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error('Non-JSON response from server:', responseText);
        alert(t.form.errorSubmitting);
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        console.error('Error submitting form:', result);
        alert(t.form.errorSubmitting);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error:', error);
      alert(t.form.errorUnexpected);
      setIsSubmitting(false);
    }
  };

  // ─── Check if a field is required ─────────────────
  const isFieldRequired = (field: string): boolean => {
    const validation = STEP_VALIDATIONS[currentStep];
    if (!validation) return false;
    return validation.requiredFields.includes(field) ||
      (validation.requiredArrayFields?.includes(field) ?? false);
  };

  // ─── Render helpers ────────────────────
  const renderTextInput = (field: string, label: string, placeholder: string, required = false) => (
    <div className="mb-4" key={field}>
      <label className="block text-gray-800 font-semibold mb-2 text-sm sm:text-base flex items-center gap-2">
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
        {!required && <span className="text-gray-400 text-xs">({t.form.optional})</span>}
      </label>
      <input
        type="text"
        value={(formState as any)[field] || ''}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 text-sm sm:text-base rounded-xl border outline-none transition-all duration-200 shadow-sm font-medium ${errors[field]
          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
          : 'border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-primary-300'
          }`}
      />
      {errors[field] && (
        <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errors[field]}
        </p>
      )}
    </div>
  );

  const renderNumberInput = (field: string, label: string, placeholder: string, required = false) => (
    <div className="mb-4" key={field}>
      <label className="block text-gray-800 font-semibold mb-2 text-sm sm:text-base flex items-center gap-2">
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
        {!required && <span className="text-gray-400 text-xs">({t.form.optional})</span>}
      </label>
      <input
        type="tel"
        inputMode="numeric"
        value={(formState as any)[field] || ''}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9]/g, '');
          updateField(field, val);
        }}
        placeholder={placeholder}
        className={`w-full px-4 py-3 text-sm sm:text-base rounded-xl border outline-none transition-all duration-200 shadow-sm font-medium ${errors[field]
          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
          : 'border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-primary-300'
          }`}
      />
      {errors[field] && (
        <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errors[field]}
        </p>
      )}
    </div>
  );

  const renderTextarea = (field: string, label: string, placeholder: string, required = false) => (
    <div className="mb-4" key={field}>
      <label className="block text-gray-800 font-semibold mb-2 text-sm sm:text-base flex items-center gap-2">
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
        {!required && <span className="text-gray-400 text-xs">({t.form.optional})</span>}
      </label>
      <textarea
        value={(formState as any)[field] || ''}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full px-4 py-3 text-sm sm:text-base rounded-xl border outline-none transition-all duration-200 shadow-sm font-medium resize-none ${errors[field]
          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
          : 'border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-primary-300'
          }`}
      />
    </div>
  );

  const renderArrayInput = (field: string, index: number, label: string, placeholder: string) => (
    <div className="mb-3" key={`${field}-${index}`}>
      <label className="block text-gray-700 font-medium mb-1.5 text-sm flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">{index + 1}</span>
        {label}
      </label>
      <input
        type="text"
        value={(formState as any)[field][index] || ''}
        onChange={(e) => updateArrayField(field, index, e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 bg-white outline-none transition-all duration-200 shadow-sm font-medium focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-primary-300"
      />
    </div>
  );

  const renderCheckboxGroup = (field: string, options: string[], label: string, required = false) => (
    <div className="mb-5" key={field}>
      <label className="block text-gray-800 font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
        <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
      </label>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${errors[field] ? 'ring-2 ring-red-200 rounded-xl p-1' : ''}`}>
        {options.map((option, idx) => (
          <label
            key={idx}
            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${(formState as any)[field]?.includes(option)
              ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
              : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/30'
              }`}
          >
            <div className={`w-5 h-5 min-w-[20px] rounded-md border-2 flex items-center justify-center mt-0.5 transition-all duration-200 ${(formState as any)[field]?.includes(option)
              ? 'border-primary-500 bg-primary-500'
              : 'border-gray-300 bg-white'
              }`}>
              {(formState as any)[field]?.includes(option) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-700 font-medium leading-snug">{option}</span>
            <input type="checkbox" className="hidden" checked={(formState as any)[field]?.includes(option)} onChange={() => toggleCheckbox(field, option)} />
          </label>
        ))}
      </div>
      {errors[field] && (
        <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errors[field]}
        </p>
      )}
    </div>
  );

  const renderRadioGroup = (field: string, options: string[], label: string) => (
    <div className="mb-5" key={field}>
      <label className="block text-gray-800 font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
        <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
        {label}
      </label>
      <div className="space-y-2.5">
        {options.map((option, idx) => (
          <label
            key={idx}
            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${(formState as any)[field] === option
              ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
              : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/30'
              }`}
          >
            <div className={`w-5 h-5 min-w-[20px] rounded-full border-2 flex items-center justify-center transition-all duration-200 ${(formState as any)[field] === option
              ? 'border-primary-500'
              : 'border-gray-300'
              }`}>
              {(formState as any)[field] === option && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
              )}
            </div>
            <span className="text-sm text-gray-700 font-medium">{option}</span>
            <input type="radio" className="hidden" name={field} value={option} checked={(formState as any)[field] === option} onChange={() => updateField(field, option)} />
          </label>
        ))}
      </div>
    </div>
  );

  // ─── Step Renderers ────────────────────
  const renderStepContent = () => {
    const step = t.steps[currentStep];
    const f = step.fields;
    const p = step.placeholders || {};
    const o = step.options || {};

    switch (currentStep) {
      case 0: // Company Data
        return (
          <div className="space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {renderTextInput('companyName', f.companyName, p.companyName || '', true)}
              {renderTextInput('sector', f.sector, p.sector || '')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {renderNumberInput('foundedYear', f.foundedYear, p.foundedYear || '')}
              {renderTextInput('countryCity', f.countryCity, p.countryCity || '')}
            </div>
            {renderTextInput('website', f.website, p.website || '')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {renderNumberInput('branchCount', f.branchCount, p.branchCount || '')}
              {renderNumberInput('employeeCount', f.employeeCount, p.employeeCount || '')}
            </div>
            <div className="border-t border-gray-200 my-4 pt-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">{isRTL ? 'بيانات مقدم الطلب' : 'Applicant Information'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {renderTextInput('applicantName', f.applicantName, p.applicantName || '', true)}
              {renderTextInput('jobTitle', f.jobTitle, p.jobTitle || '')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {renderNumberInput('mobile', f.mobile, p.mobile || '', true)}
              {renderTextInput('email', f.email, p.email || '')}
            </div>
          </div>
        );

      case 1: // Reason
        return (
          <div>
            {renderCheckboxGroup('requestReasons', o.requestReasons || [], f.requestReasons)}
            {renderTextInput('otherRequestReason', f.otherRequestReason, p.otherRequestReason || '')}
            <div className="mt-2">
              {renderTextarea('challengeDescription', f.challengeDescription, p.challengeDescription || '')}
            </div>
          </div>
        );

      case 2: // Current Situation
        return (
          <div>
            <div className="mb-6">
              <h4 className="text-gray-800 font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
                {f.challengesTitle}
              </h4>
              <div className="space-y-1">
                {renderArrayInput('challenges', 0, f.challenge1, p.challenge1 || '')}
                {renderArrayInput('challenges', 1, f.challenge2, p.challenge2 || '')}
                {renderArrayInput('challenges', 2, f.challenge3, p.challenge3 || '')}
              </div>
            </div>
            <div>
              <h4 className="text-gray-800 font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
                {f.strengthsTitle}
              </h4>
              <div className="space-y-1">
                {renderArrayInput('strengths', 0, f.strength1, p.strength1 || '')}
                {renderArrayInput('strengths', 1, f.strength2, p.strength2 || '')}
                {renderArrayInput('strengths', 2, f.strength3, p.strength3 || '')}
              </div>
            </div>
          </div>
        );

      case 3: // Scope
        return (
          <div>
            {renderCheckboxGroup('scopeOptions', o.scopeOptions || [], f.scopeOptions)}
            {renderTextInput('otherScopeOption', f.otherScopeOption, p.otherScopeOption || '')}
          </div>
        );

      case 4: // Markets & Clients
        return (
          <div>
            {renderTextInput('currentClients', f.currentClients, p.currentClients || '')}
            {renderTextInput('clientSegments', f.clientSegments, p.clientSegments || '')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {renderTextInput('currentRegions', f.currentRegions, p.currentRegions || '')}
              {renderTextInput('targetMarkets', f.targetMarkets, p.targetMarkets || '')}
            </div>
            <div className="mt-4">
              <h4 className="text-gray-800 font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
                {f.competitorsTitle}
              </h4>
              <div className="space-y-1">
                {renderArrayInput('competitors', 0, f.competitor1, p.competitor1 || '')}
                {renderArrayInput('competitors', 1, f.competitor2, p.competitor2 || '')}
                {renderArrayInput('competitors', 2, f.competitor3, p.competitor3 || '')}
              </div>
            </div>
          </div>
        );

      case 5: // Performance
        return (
          <div>
            <p className="text-sm text-gray-500 mb-4 italic">{isRTL ? '(إن أمكن)' : '(if possible)'}</p>
            {renderTextInput('annualRevenue', f.annualRevenue, p.annualRevenue || '')}
            {renderTextInput('growthRate', f.growthRate, p.growthRate || '')}
            {renderTextInput('profitMargin', f.profitMargin, p.profitMargin || '')}
          </div>
        );

      case 6: // Expected Outputs
        return (
          <div>
            {renderCheckboxGroup('expectedOutputs', o.expectedOutputs || [], f.expectedOutputs)}
            {renderTextInput('otherExpectedOutput', f.otherExpectedOutput, p.otherExpectedOutput || '')}
          </div>
        );

      case 7: // Timeline
        return (
          <div>
            <div className="mb-5">
              <label className="block text-gray-800 font-semibold mb-2 text-sm sm:text-base">{f.proposedStartDate}</label>
              <input
                type="date"
                value={formState.proposedStartDate}
                onChange={(e) => updateField('proposedStartDate', e.target.value)}
                className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-gray-300 bg-white outline-none transition-all duration-200 shadow-sm font-medium focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-primary-300"
              />
            </div>
            {renderRadioGroup('urgency', o.urgency || [], f.urgency)}
          </div>
        );

      case 8: // Attachments
        return (
          <div>
            {renderCheckboxGroup('attachmentTypes', o.attachmentTypes || [], f.attachmentTypes)}

            <div className="mt-6">
              <label className="block text-gray-800 font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
                <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
                {f.files}
              </label>
              <p className="text-sm text-gray-500 mb-4">{t.form.uploadHelp}</p>

              <div className="relative border-2 border-dashed border-primary-300 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 hover:from-primary-100 hover:to-primary-200/50 transition-all duration-300 p-8 text-center cursor-pointer group">
                <input
                  type="file"
                  aria-label="file upload"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                  multiple
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center gap-3 pointer-events-none">
                  <div className="p-4 bg-white rounded-full shadow-lg group-hover:scale-110 transition-all duration-300">
                    <Upload className="w-6 h-6 text-primary-600" />
                  </div>
                  <span className="text-primary-700 font-semibold text-sm">{t.form.uploadButtonText}</span>
                </div>
              </div>

              {formState.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formState.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800 font-medium truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-500 hover:text-red-700 text-sm font-bold px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };


  // ─── Success Screen ────────────────────
  if (isSubmitted) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 font-${isRTL ? 'cairo' : 'sans'}`}>
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 md:p-12 max-w-lg w-full text-center border-t-8 border-primary-500 animate-scale-in">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">{t.form.successTitle}</h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{t.form.successMessage}</p>
        </div>
      </div>
    );
  }

  // ─── Main render ───────────────────────
  const StepIcon = STEP_ICONS[currentStep] || Building2;

  // Check if current step has required fields
  const currentStepValidation = STEP_VALIDATIONS[currentStep];
  const hasRequiredFields = currentStepValidation &&
    (currentStepValidation.requiredFields.length > 0 ||
      (currentStepValidation.requiredArrayFields && currentStepValidation.requiredArrayFields.length > 0));

  return (
    <div className={`min-h-screen bg-slate-50 font-${isRTL ? 'cairo' : 'sans'}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/file.png" alt="Logo" className="h-12 sm:h-16 md:h-20 w-auto object-contain" />
          </div>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:max-w-[55%] lg:max-w-[55%] xl:max-w-[55%]">
        {/* Intro Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500"></div>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-5 leading-tight">{t.title}</h2>
            <div className="w-16 h-1 bg-primary-500 rounded-full mb-4 sm:mb-5"></div>
            <p className="text-gray-700 leading-relaxed text-base sm:text-lg">{t.description}</p>
          </div>
        </div>

        {/* Progress Bar with Robot */}
        <ProgressRobot
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          stepTitle={t.steps[currentStep]?.title || ''}
          stepOf={t.form.stepOf}
          isRTL={isRTL}
          onStepClick={(i) => {
            if (i !== currentStep) {
              // Allow going back without validation
              if (i < currentStep) {
                setSlideDirection('prev');
                setCurrentStep(i);
                setErrors({});
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                // Going forward: validate each step in between
                let canProceed = true;
                for (let s = currentStep; s < i; s++) {
                  const stepErrors = validateStep(s);
                  if (Object.keys(stepErrors).length > 0) {
                    setErrors(stepErrors);
                    setCurrentStep(s);
                    canProceed = false;
                    break;
                  }
                }
                if (canProceed) {
                  setSlideDirection('next');
                  setCurrentStep(i);
                  setErrors({});
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }
            }
          }}
        />

        {/* Validation Notice Banner */}
        {hasRequiredFields && Object.keys(errors).length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-700 font-semibold">
                {isRTL ? 'يرجى إكمال الحقول المطلوبة قبل المتابعة' : 'Please complete the required fields before proceeding'}
              </p>
              <p className="text-xs text-red-500 mt-1">
                {isRTL ? 'الحقول المحددة بـ (*) مطلوبة' : 'Fields marked with (*) are required'}
              </p>
            </div>
          </div>
        )}

        {/* Form Step Card */}
        <form onSubmit={handleSubmit}>
          <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ${isAnimating ? 'opacity-70 scale-[0.99]' : 'opacity-100 scale-100'}`}>
            {/* Step Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 sm:px-8 py-5 sm:py-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <StepIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-primary-100 text-xs font-semibold uppercase tracking-wider">
                  {isRTL ? `المرحلة ${currentStep + 1}` : `Step ${currentStep + 1}`}
                </span>
                <h3 className="text-white text-lg sm:text-xl font-bold">
                  {t.steps[currentStep].title}
                </h3>
              </div>
              {/* Required/Optional badge */}
              <div className={`ms-auto px-3 py-1 rounded-full text-xs font-bold ${hasRequiredFields
                ? 'bg-red-100/20 text-red-100 border border-red-200/30'
                : 'bg-green-100/20 text-green-100 border border-green-200/30'
                }`}>
                {hasRequiredFields
                  ? (isRTL ? 'يحتوي حقول مطلوبة' : 'Has required fields')
                  : (isRTL ? 'جميع الحقول اختيارية' : 'All fields optional')
                }
              </div>
            </div>

            {/* Step Content */}
            <div className={`p-6 sm:p-8 step-content ${isAnimating ? (slideDirection === 'next' ? 'slide-out-left' : 'slide-out-right') : 'slide-in'}`}>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex items-center justify-between gap-4">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={() => goToStep('prev')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-sm sm:text-base hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200"
                >
                  {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  {t.form.previous}
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep('next')}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm sm:text-base hover:bg-primary-700 shadow-lg shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  {t.form.next}
                  {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm sm:text-base hover:bg-primary-700 shadow-lg shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t.form.submitting}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 rtl:rotate-180" />
                      {t.form.submit}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className={`mt-8 sm:mt-12 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white shadow-2xl font-${isRTL ? 'cairo' : 'sans'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-10">
            {/* Services */}
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-4 sm:mb-5 pb-3 border-b border-white/20">
                <div className="w-1 h-6 bg-primary-300 rounded-full"></div>
                <h3 className="text-base sm:text-lg font-bold text-white">{t.footer.servicesTitle}</h3>
              </div>
              <ul className="space-y-2.5 sm:space-y-3">
                {t.footer.services.map((service, idx) => (
                  <li key={idx} className="flex items-start gap-2 group">
                    <span className="text-primary-300 mt-1.5 text-xs">▸</span>
                    <span className="text-sm sm:text-base text-gray-100 group-hover:text-white transition-colors duration-200 leading-relaxed">{service}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Branches */}
            <div className="animate-fade-in-delay-1">
              <div className="flex items-center gap-2 mb-4 sm:mb-5 pb-3 border-b border-white/20">
                <div className="w-1 h-6 bg-primary-300 rounded-full"></div>
                <h3 className="text-base sm:text-lg font-bold text-white">{t.footer.branchesTitle}</h3>
              </div>
              <ul className="space-y-2.5 sm:space-y-3">
                {t.footer.branches.map((branch, idx) => (
                  <li key={idx} className="flex items-start gap-2 group">
                    <span className="text-primary-300 mt-1.5 text-xs">▸</span>
                    <span className="text-sm sm:text-base text-gray-100 group-hover:text-white transition-colors duration-200 leading-relaxed">{branch}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Info */}
            <div className="animate-fade-in-delay-2">
              <div className="flex items-center gap-2 mb-4 sm:mb-5 pb-3 border-b border-white/20">
                <div className="w-1 h-6 bg-primary-300 rounded-full"></div>
                <h3 className="text-base sm:text-lg font-bold text-white">{t.footer.companyTitle}</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-100 leading-relaxed">{t.footer.companyDescription}</p>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/20 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm sm:text-base text-gray-200 text-center sm:text-left">{t.footer.copyright}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;