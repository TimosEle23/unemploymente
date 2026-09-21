import type { Application, Profile } from "./types";

const ALIASES: Record<string, string[]> = {
  python: ["python3"],
  "machine learning": ["ml", "machinelearning"],
  "deep learning": ["dl", "neural networks"],
  nlp: ["natural language processing", "llm", "llms"],
  pytorch: ["torch"],
  tensorflow: ["tf", "keras"],
  "scikit-learn": ["sklearn", "scikit learn"],
  pandas: ["dataframes"],
  ai: ["artificial intelligence"],
  "reinforcement learning": ["rl"],
  "time series": ["forecasting", "timeseries"],
  "data mining": ["data analysis"],
};

const RELATED: Record<string, string[]> = {
  mlops: ["machine learning", "deep learning", "python"],
  docker: ["python"],
  kubernetes: ["docker"],
  aws: ["cloud"],
  azure: ["cloud"],
  gcp: ["cloud"],
  spark: ["data mining", "pandas"],
  sql: ["data mining", "pandas"],
  airflow: ["python"],
  "computer vision": ["deep learning", "pytorch"],
  llm: ["nlp", "deep learning"],
  "generative ai": ["deep learning", "nlp"],
  transformers: ["nlp", "deep learning"],
};

const norm = (value: string) => value.trim().toLowerCase();

function expand(skill: string): string[] {
  const base = norm(skill);
  return [base, ...(ALIASES[base] ?? [])];
}

function profileSet(profile: Profile | null): Set<string> {
  const set = new Set<string>();
  for (const skill of profile?.skills ?? []) expand(skill).forEach((value) => set.add(value));
  return set;
}

function isMatch(requirement: string, mine: Set<string>): boolean {
  const variants = expand(requirement);
  for (const variant of variants) {
    if (mine.has(variant)) return true;
    for (const own of mine) {
      if (own.length > 3 && (own.includes(variant) || variant.includes(own))) return true;
    }
  }
  return false;
}

function isPartial(requirement: string, mine: Set<string>): boolean {
  const related = RELATED[norm(requirement)] ?? [];
  return related.some((value) => mine.has(value));
}

export type MatchReport = {
  matched: string[];
  missing: string[];
  partial: string[];
  relevantExperience: string[];
  gaps: string[];
};

export function buildMatchReport(app: Application, profile: Profile | null): MatchReport {
  const mine = profileSet(profile);
  const requirements = Array.from(
    new Set(
      [
        ...app.required_skills,
        ...app.preferred_skills,
        ...app.programming_languages,
        ...app.ml_technologies,
        ...app.cloud_technologies,
        ...app.frameworks,
      ]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  const matched: string[] = [];
  const missing: string[] = [];
  const partial: string[] = [];

  for (const requirement of requirements) {
    if (isMatch(requirement, mine)) matched.push(requirement);
    else if (isPartial(requirement, mine)) partial.push(requirement);
    else missing.push(requirement);
  }

  const relevantExperience = (profile?.education ?? []).concat(
    matched.length ? [`${matched.length} of my skills appear in this posting`] : [],
  );

  const gaps: string[] = [];
  const education = `${app.education_requirements ?? ""}`.toLowerCase();
  if (education.includes("phd") && !(profile?.education ?? []).some((e) => /phd/i.test(e))) {
    gaps.push("Posting mentions a PhD requirement");
  }
  if (app.required_experience) gaps.push(`Experience asked: ${app.required_experience}`);
  for (const skill of missing.slice(0, 6)) gaps.push(`No evidence of ${skill} in my profile`);

  return { matched, missing, partial, relevantExperience, gaps };
}
