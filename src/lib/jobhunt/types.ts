export const STATUSES = [
  "NEW",
  "SAVED",
  "APPLIED",
  "HR_INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  NEW: "NEW",
  SAVED: "SAVED",
  APPLIED: "APPLIED",
  HR_INTERVIEW: "HR INTERVIEW",
  TECHNICAL_INTERVIEW: "TECHNICAL INTERVIEW",
  FINAL_INTERVIEW: "FINAL INTERVIEW",
  OFFER: "OFFER",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
};

/** GREEN = active progress, GREY = neutral/waiting, RED = rejected, WHITE = new */
export type StatusTone = "ok" | "neutral" | "bad" | "fresh";

export const STATUS_TONE: Record<Status, StatusTone> = {
  NEW: "fresh",
  SAVED: "neutral",
  APPLIED: "ok",
  HR_INTERVIEW: "ok",
  TECHNICAL_INTERVIEW: "ok",
  FINAL_INTERVIEW: "ok",
  OFFER: "ok",
  REJECTED: "bad",
  WITHDRAWN: "neutral",
};

export const INTERVIEW_STATUSES: Status[] = [
  "HR_INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "FINAL_INTERVIEW",
];

export const ACTIVE_STATUSES: Status[] = [
  "SAVED",
  "APPLIED",
  "HR_INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "FINAL_INTERVIEW",
  "NEW",
];

export const KANBAN_COLUMNS: { key: string; label: string; statuses: Status[] }[] = [
  { key: "SAVED", label: "SAVED", statuses: ["SAVED", "NEW"] },
  { key: "APPLIED", label: "APPLIED", statuses: ["APPLIED"] },
  { key: "HR_INTERVIEW", label: "HR", statuses: ["HR_INTERVIEW"] },
  { key: "TECHNICAL_INTERVIEW", label: "TECHNICAL", statuses: ["TECHNICAL_INTERVIEW"] },
  { key: "FINAL_INTERVIEW", label: "FINAL", statuses: ["FINAL_INTERVIEW"] },
  { key: "OFFER", label: "OFFER", statuses: ["OFFER"] },
  { key: "REJECTED", label: "REJECTED", statuses: ["REJECTED", "WITHDRAWN"] },
];

export const WORK_ARRANGEMENTS = ["Remote", "Hybrid", "Onsite"] as const;

export const NEXT_ACTIONS = [
  "Apply",
  "Follow up",
  "Prepare HR interview",
  "Prepare technical interview",
  "Send thank you email",
  "Contact recruiter",
  "Check application status",
] as const;

export const EVENT_TYPES = [
  "JOB SAVED",
  "APPLICATION SUBMITTED",
  "HR INTERVIEW",
  "TECHNICAL INTERVIEW",
  "FINAL INTERVIEW",
  "OFFER RECEIVED",
  "REJECTED",
  "FOLLOW UP SENT",
  "NOTE",
] as const;

export type Application = {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  location: string | null;
  work_arrangement: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_text: string | null;
  currency: string | null;
  required_experience: string | null;
  education_requirements: string | null;
  required_skills: string[];
  preferred_skills: string[];
  programming_languages: string[];
  ml_technologies: string[];
  cloud_technologies: string[];
  frameworks: string[];
  description: string | null;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  application_deadline: string | null;
  posted_date: string | null;
  job_url: string | null;
  job_board: string | null;
  recruiter_name: string | null;
  recruiter_contact: string | null;
  contact_info: string | null;
  status: Status;
  applied_at: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
  extra_info: string | null;
  is_seed: boolean;
  extraction_source: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationEvent = {
  id: string;
  application_id: string;
  event_date: string;
  event_type: string;
  notes: string | null;
};

export type Screenshot = {
  id: string;
  application_id: string | null;
  storage_path: string;
  file_name: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  application_id: string;
  category: string;
  content: string;
  created_at: string;
};

export type Followup = {
  id: string;
  application_id: string;
  action: string;
  due_date: string | null;
  done: boolean;
  notes: string | null;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  headline: string | null;
  education: string[];
  skills: string[];
  years_experience: number | null;
  cv_file_name: string | null;
  cv_storage_path: string | null;
  cv_updated_at: string | null;
};

/** Structured shape produced by the AI extraction pipeline. */
export type ExtractedJob = {
  job_title: string | null;
  company: string | null;
  location: string | null;
  work_arrangement: string | null;
  employment_type: string | null;
  salary_text: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  required_experience: string | null;
  education_requirements: string | null;
  required_skills: string[];
  preferred_skills: string[];
  programming_languages: string[];
  ml_technologies: string[];
  cloud_technologies: string[];
  frameworks: string[];
  description: string | null;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  application_deadline: string | null;
  posted_date: string | null;
  job_url: string | null;
  job_board: string | null;
  recruiter_name: string | null;
  recruiter_contact: string | null;
  contact_info: string | null;
  extra_info: string | null;
};

export function emptyExtraction(): ExtractedJob {
  return {
    job_title: null,
    company: null,
    location: null,
    work_arrangement: null,
    employment_type: null,
    salary_text: null,
    salary_min: null,
    salary_max: null,
    currency: null,
    required_experience: null,
    education_requirements: null,
    required_skills: [],
    preferred_skills: [],
    programming_languages: [],
    ml_technologies: [],
    cloud_technologies: [],
    frameworks: [],
    description: null,
    responsibilities: [],
    requirements: [],
    qualifications: [],
    benefits: [],
    application_deadline: null,
    posted_date: null,
    job_url: null,
    job_board: null,
    recruiter_name: null,
    recruiter_contact: null,
    contact_info: null,
    extra_info: null,
  };
}

export const REQUIRED_FIELDS: (keyof ExtractedJob)[] = ["job_title", "company"];

export const REVIEW_FIELDS: (keyof ExtractedJob)[] = [
  "job_title",
  "company",
  "location",
  "work_arrangement",
  "employment_type",
  "salary_text",
  "currency",
  "required_experience",
  "education_requirements",
  "application_deadline",
  "posted_date",
  "job_url",
  "job_board",
  "recruiter_name",
  "recruiter_contact",
  "contact_info",
];
