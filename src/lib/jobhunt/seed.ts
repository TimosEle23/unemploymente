import { createApplication } from "./api";
import type { Application } from "./types";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type Seed = Partial<Application> & { job_title: string; company: string };

const SEEDS: Seed[] = [
  {
    job_title: "Machine Learning Engineer",
    company: "Northwind Analytics",
    location: "Amsterdam, Netherlands",
    work_arrangement: "Hybrid",
    employment_type: "Full-time",
    salary_text: "€45,000 to €60,000",
    currency: "EUR",
    required_experience: "2+ years in applied machine learning",
    education_requirements: "MSc in AI, Computer Science or related field",
    required_skills: ["Python", "PyTorch", "Machine Learning", "SQL", "Docker"],
    preferred_skills: ["AWS", "Kubernetes", "MLOps"],
    programming_languages: ["Python", "SQL"],
    ml_technologies: ["PyTorch", "scikit-learn"],
    cloud_technologies: ["AWS"],
    frameworks: ["FastAPI"],
    description:
      "Build and ship production machine learning models for demand forecasting across European retail clients.",
    responsibilities: [
      "Design and train forecasting models",
      "Deploy models to production with the platform team",
      "Own model monitoring and retraining",
    ],
    requirements: ["Strong Python", "Experience with deep learning frameworks", "SQL fluency"],
    benefits: ["Pension scheme", "Learning budget", "2 remote days per week"],
    job_board: "LinkedIn",
    status: "APPLIED",
    applied_at: daysAgo(4),
    posted_date: daysAgo(9),
    next_action: "Follow up",
    next_action_date: inDays(1),
    is_seed: true,
    notes: "Interesting forecasting work, good match with my time series background.",
  },
  {
    job_title: "AI Engineer",
    company: "Helix Systems",
    location: "Remote (EU)",
    work_arrangement: "Remote",
    employment_type: "Full-time",
    salary_text: "€55,000 to €70,000",
    currency: "EUR",
    required_skills: ["Python", "LLM", "NLP", "Docker", "AWS"],
    preferred_skills: ["LangChain", "Kubernetes", "Vector databases"],
    programming_languages: ["Python", "TypeScript"],
    ml_technologies: ["Transformers", "PyTorch"],
    cloud_technologies: ["AWS"],
    description: "Build LLM powered assistants for internal enterprise knowledge bases.",
    responsibilities: ["Prototype LLM features", "Evaluate retrieval quality", "Ship API services"],
    job_board: "Indeed",
    status: "TECHNICAL_INTERVIEW",
    applied_at: daysAgo(12),
    posted_date: daysAgo(18),
    next_action: "Prepare technical interview",
    next_action_date: inDays(2),
    is_seed: true,
  },
  {
    job_title: "Data Scientist",
    company: "Meridian Health",
    location: "Utrecht, Netherlands",
    work_arrangement: "Onsite",
    employment_type: "Full-time",
    salary_text: "€48,000 to €58,000",
    currency: "EUR",
    required_skills: ["Python", "pandas", "Statistics", "SQL"],
    preferred_skills: ["R", "Time Series", "Tableau"],
    description: "Support clinical teams with statistical analysis and predictive models.",
    job_board: "Company career page",
    status: "SAVED",
    posted_date: daysAgo(3),
    next_action: "Apply",
    next_action_date: inDays(0),
    is_seed: true,
  },
  {
    job_title: "Computer Vision Engineer",
    company: "Orbital Robotics",
    location: "Eindhoven, Netherlands",
    work_arrangement: "Hybrid",
    employment_type: "Full-time",
    salary_text: "€50,000 to €65,000",
    currency: "EUR",
    required_skills: ["Python", "PyTorch", "Computer Vision", "OpenCV", "C++"],
    preferred_skills: ["ROS", "CUDA", "Kubernetes"],
    ml_technologies: ["PyTorch", "OpenCV"],
    description: "Develop perception models for warehouse robotics platforms.",
    job_board: "LinkedIn",
    status: "REJECTED",
    applied_at: daysAgo(25),
    posted_date: daysAgo(31),
    is_seed: true,
    notes: "Rejected after CV screening — C++ experience was the blocker.",
  },
  {
    job_title: "NLP Engineer",
    company: "Lexicon Labs",
    location: "Rotterdam, Netherlands",
    work_arrangement: "Hybrid",
    employment_type: "Full-time",
    salary_text: "€52,000 to €64,000",
    currency: "EUR",
    required_skills: ["Python", "NLP", "Transformers", "Deep Learning"],
    preferred_skills: ["MLOps", "GCP", "Airflow"],
    description: "Improve multilingual document understanding pipelines.",
    job_board: "LinkedIn",
    status: "HR_INTERVIEW",
    applied_at: daysAgo(7),
    posted_date: daysAgo(14),
    next_action: "Prepare HR interview",
    next_action_date: inDays(4),
    is_seed: true,
  },
];

export async function insertSeedData(userId: string) {
  for (const seed of SEEDS) {
    await createApplication(userId, { ...seed, extraction_source: "SEED" } as Seed);
  }
}
