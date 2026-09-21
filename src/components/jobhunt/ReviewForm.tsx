import { Field, Panel, Tag, inputClass } from "./ui";
import { STATUSES, STATUS_LABEL, WORK_ARRANGEMENTS, NEXT_ACTIONS } from "@/lib/jobhunt/types";
import type { ExtractedJob, Status } from "@/lib/jobhunt/types";

export type Draft = ExtractedJob & {
  status: Status;
  applied_at: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
};

const LIST_FIELDS: { key: keyof ExtractedJob; label: string }[] = [
  { key: "required_skills", label: "REQUIRED SKILLS" },
  { key: "preferred_skills", label: "PREFERRED SKILLS" },
  { key: "programming_languages", label: "PROGRAMMING LANGUAGES" },
  { key: "ml_technologies", label: "MACHINE LEARNING TECH" },
  { key: "cloud_technologies", label: "CLOUD TECHNOLOGIES" },
  { key: "frameworks", label: "FRAMEWORKS" },
];

const BLOCK_FIELDS: { key: keyof ExtractedJob; label: string }[] = [
  { key: "responsibilities", label: "RESPONSIBILITIES" },
  { key: "requirements", label: "REQUIREMENTS" },
  { key: "qualifications", label: "QUALIFICATIONS" },
  { key: "benefits", label: "BENEFITS" },
];

export function ReviewForm({
  draft,
  onChange,
  missingFields = [],
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  missingFields?: string[];
}) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => onChange({ ...draft, [key]: value });
  const text = (key: keyof Draft) => (draft[key] as string | null) ?? "";

  return (
    <div className="space-y-4">
      {missingFields.length ? (
        <Panel title="NOT FOUND IN SCREENSHOTS" bodyClassName="flex flex-wrap gap-1">
          {missingFields.map((field) => (
            <Tag key={field}>{field.replace(/_/g, " ").toUpperCase()}</Tag>
          ))}
        </Panel>
      ) : null}

      <Panel title="CORE INFORMATION">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="JOB TITLE *">
            <input
              className={inputClass}
              value={text("job_title")}
              onChange={(event) => set("job_title", event.target.value)}
            />
          </Field>
          <Field label="COMPANY *">
            <input
              className={inputClass}
              value={text("company")}
              onChange={(event) => set("company", event.target.value)}
            />
          </Field>
          <Field label="LOCATION">
            <input
              className={inputClass}
              value={text("location")}
              onChange={(event) => set("location", event.target.value)}
            />
          </Field>
          <Field label="WORK TYPE">
            <select
              className={inputClass}
              value={text("work_arrangement")}
              onChange={(event) => set("work_arrangement", event.target.value || null)}
            >
              <option value="">—</option>
              {WORK_ARRANGEMENTS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
          <Field label="EMPLOYMENT TYPE">
            <input
              className={inputClass}
              value={text("employment_type")}
              onChange={(event) => set("employment_type", event.target.value)}
            />
          </Field>
          <Field label="SALARY">
            <input
              className={inputClass}
              value={text("salary_text")}
              onChange={(event) => set("salary_text", event.target.value)}
            />
          </Field>
          <Field label="CURRENCY">
            <input
              className={inputClass}
              value={text("currency")}
              onChange={(event) => set("currency", event.target.value)}
            />
          </Field>
          <Field label="REQUIRED EXPERIENCE">
            <input
              className={inputClass}
              value={text("required_experience")}
              onChange={(event) => set("required_experience", event.target.value)}
            />
          </Field>
          <Field label="EDUCATION REQUIREMENTS">
            <input
              className={inputClass}
              value={text("education_requirements")}
              onChange={(event) => set("education_requirements", event.target.value)}
            />
          </Field>
          <Field label="JOB BOARD / SOURCE">
            <input
              className={inputClass}
              value={text("job_board")}
              onChange={(event) => set("job_board", event.target.value)}
            />
          </Field>
          <Field label="JOB URL">
            <input
              className={inputClass}
              value={text("job_url")}
              onChange={(event) => set("job_url", event.target.value)}
            />
          </Field>
          <Field label="POSTING DATE">
            <input
              type="date"
              className={inputClass}
              value={text("posted_date")}
              onChange={(event) => set("posted_date", event.target.value || null)}
            />
          </Field>
          <Field label="APPLICATION DEADLINE">
            <input
              type="date"
              className={inputClass}
              value={text("application_deadline")}
              onChange={(event) => set("application_deadline", event.target.value || null)}
            />
          </Field>
          <Field label="RECRUITER">
            <input
              className={inputClass}
              value={text("recruiter_name")}
              onChange={(event) => set("recruiter_name", event.target.value)}
            />
          </Field>
          <Field label="RECRUITER CONTACT">
            <input
              className={inputClass}
              value={text("recruiter_contact")}
              onChange={(event) => set("recruiter_contact", event.target.value)}
            />
          </Field>
          <Field label="CONTACT INFORMATION">
            <input
              className={inputClass}
              value={text("contact_info")}
              onChange={(event) => set("contact_info", event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="SKILLS & TECHNOLOGIES">
        <div className="grid gap-3 sm:grid-cols-2">
          {LIST_FIELDS.map((field) => (
            <Field key={field.key} label={`${field.label} (COMMA SEPARATED)`}>
              <input
                className={inputClass}
                value={((draft[field.key] as string[]) ?? []).join(", ")}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    [field.key]: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          ))}
        </div>
      </Panel>

      <Panel title="JOB CONTENT">
        <div className="space-y-3">
          <Field label="JOB DESCRIPTION">
            <textarea
              className={`${inputClass} min-h-28 font-sans`}
              value={text("description")}
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>
          {BLOCK_FIELDS.map((field) => (
            <Field key={field.key} label={`${field.label} (ONE PER LINE)`}>
              <textarea
                className={`${inputClass} min-h-24 font-sans`}
                value={((draft[field.key] as string[]) ?? []).join("\n")}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    [field.key]: event.target.value
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          ))}
          <Field label="OTHER RELEVANT INFORMATION">
            <textarea
              className={`${inputClass} min-h-20 font-sans`}
              value={text("extra_info")}
              onChange={(event) => set("extra_info", event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="TRACKING">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="STATUS">
            <select
              className={inputClass}
              value={draft.status}
              onChange={(event) => set("status", event.target.value as Status)}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="APPLICATION DATE">
            <input
              type="date"
              className={inputClass}
              value={draft.applied_at ?? ""}
              onChange={(event) => set("applied_at", event.target.value || null)}
            />
          </Field>
          <Field label="NEXT ACTION">
            <select
              className={inputClass}
              value={draft.next_action ?? ""}
              onChange={(event) => set("next_action", event.target.value || null)}
            >
              <option value="">—</option>
              {NEXT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </Field>
          <Field label="NEXT ACTION DATE">
            <input
              type="date"
              className={inputClass}
              value={draft.next_action_date ?? ""}
              onChange={(event) => set("next_action_date", event.target.value || null)}
            />
          </Field>
          <Field label="MY NOTES" className="sm:col-span-2">
            <textarea
              className={`${inputClass} min-h-20 font-sans`}
              value={draft.notes ?? ""}
              onChange={(event) => set("notes", event.target.value)}
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}
