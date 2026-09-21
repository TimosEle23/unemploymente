import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shell } from "@/components/jobhunt/Shell";
import { EmptyState, Field, Panel, RetroButton, Tag, inputClass } from "@/components/jobhunt/ui";
import { ReviewForm, type Draft } from "@/components/jobhunt/ReviewForm";
import { extractJobFromScreenshots } from "@/lib/jobhunt/extract.functions";
import { createApplication, findDuplicates, uploadScreenshots } from "@/lib/jobhunt/api";
import { useApplications } from "@/lib/jobhunt/hooks";
import { useAuth } from "@/lib/auth";
import { emptyExtraction, type Application, type ExtractedJob } from "@/lib/jobhunt/types";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Add job — JOBHUNT" },
      {
        name: "description",
        content:
          "Add an AI / ML job to JOBHUNT by uploading job advertisement screenshots for AI extraction, or by entering the details manually.",
      },
      { property: "og:title", content: "Add job — JOBHUNT" },
      {
        property: "og:description",
        content: "Upload job screenshots and let AI extract structured job data, or enter it manually.",
      },
    ],
  }),
  component: AddJobPage,
});

function emptyDraft(): Draft {
  return {
    ...emptyExtraction(),
    status: "NEW",
    applied_at: null,
    next_action: null,
    next_action_date: null,
    notes: null,
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

type Step = "choose" | "upload" | "review";

function AddJobPage() {
  const [step, setStep] = useState<Step>("choose");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState<"AI_SCREENSHOT" | "MANUAL">("MANUAL");
  const [duplicates, setDuplicates] = useState<Application[] | null>(null);

  const extract = useServerFn(extractJobFromScreenshots);
  const { data: apps = [] } = useApplications();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function runExtraction() {
    if (!files.length) {
      toast.error("Select at least one screenshot");
      return;
    }
    setBusy(true);
    try {
      const images = await Promise.all(
        files.map(async (file) => ({ name: file.name, dataUrl: await fileToDataUrl(file) })),
      );
      const result = await extract({ data: { images } });
      const extracted = result.extracted as unknown as ExtractedJob;
      setDraft({
        ...emptyDraft(),
        ...extracted,
        status: "NEW",
      });
      setMissingFields(result.missingFields);
      setRawText(result.rawText);
      setSource("AI_SCREENSHOT");
      const found = findDuplicates(apps, {
        job_title: extracted.job_title,
        company: extracted.company,
        job_url: extracted.job_url,
      });
      setDuplicates(found.length ? found : null);
      setStep("review");
      toast.success(`Extracted from ${files.length} screenshot(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Extraction failed");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!user) return;
    if (!draft.job_title?.trim() || !draft.company?.trim()) {
      toast.error("Job title and company are required");
      return;
    }
    setBusy(true);
    try {
      const app = await createApplication(user.id, {
        job_title: draft.job_title.trim(),
        company: draft.company.trim(),
        location: draft.location,
        work_arrangement: draft.work_arrangement,
        employment_type: draft.employment_type,
        salary_text: draft.salary_text,
        salary_min: draft.salary_min,
        salary_max: draft.salary_max,
        currency: draft.currency,
        required_experience: draft.required_experience,
        education_requirements: draft.education_requirements,
        required_skills: draft.required_skills,
        preferred_skills: draft.preferred_skills,
        programming_languages: draft.programming_languages,
        ml_technologies: draft.ml_technologies,
        cloud_technologies: draft.cloud_technologies,
        frameworks: draft.frameworks,
        description: draft.description,
        responsibilities: draft.responsibilities,
        requirements: draft.requirements,
        qualifications: draft.qualifications,
        benefits: draft.benefits,
        application_deadline: draft.application_deadline,
        posted_date: draft.posted_date,
        job_url: draft.job_url,
        job_board: draft.job_board,
        recruiter_name: draft.recruiter_name,
        recruiter_contact: draft.recruiter_contact,
        contact_info: draft.contact_info,
        extra_info: draft.extra_info,
        status: draft.status,
        applied_at: draft.applied_at,
        next_action: draft.next_action,
        next_action_date: draft.next_action_date,
        notes: draft.notes,
        extraction_source: source,
      });
      if (files.length) await uploadScreenshots(user.id, app.id, files);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application saved");
      navigate({ to: "/applications/$id", params: { id: app.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save application");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="space-y-4">
        <h1 className="pixel-text text-[14px] text-foreground">ADD JOB</h1>

        {step === "choose" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="UPLOAD SCREENSHOT">
              <p className="font-sans text-[13px] text-muted-foreground">
                Upload one or more screenshots of the same job advertisement. The AI reads them, merges
                them and fills a structured record you can edit before saving.
              </p>
              <div className="pt-4">
                <RetroButton variant="primary" onClick={() => setStep("upload")}>
                  UPLOAD SCREENSHOT
                </RetroButton>
              </div>
            </Panel>
            <Panel title="ENTER MANUALLY">
              <p className="font-sans text-[13px] text-muted-foreground">
                Fill in the same fields yourself, with no AI involved.
              </p>
              <div className="pt-4">
                <RetroButton
                  onClick={() => {
                    setDraft(emptyDraft());
                    setMissingFields([]);
                    setSource("MANUAL");
                    setStep("review");
                  }}
                >
                  ENTER MANUALLY
                </RetroButton>
              </div>
            </Panel>
          </div>
        ) : null}

        {step === "upload" ? (
          <Panel title="JOB SCREENSHOTS">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className={inputClass}
            />
            <p className="pt-2 font-sans text-[12px] text-muted-foreground">
              Multiple screenshots of the same advertisement are merged into one application. Anything
              the AI cannot read is left empty — nothing is invented.
            </p>
            {files.length ? (
              <div className="flex flex-wrap gap-1 pt-3">
                {files.map((file) => (
                  <Tag key={file.name}>{file.name}</Tag>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-4">
              <RetroButton variant="primary" onClick={runExtraction} disabled={busy}>
                {busy ? "READING SCREENSHOTS…" : "EXTRACT JOB DATA"}
              </RetroButton>
              <RetroButton onClick={() => setStep("choose")} disabled={busy}>
                BACK
              </RetroButton>
            </div>
          </Panel>
        ) : null}

        {step === "review" ? (
          <div className="space-y-4">
            {duplicates ? (
              <Panel title="POSSIBLE DUPLICATE">
                <p className="font-sans text-[13px] text-foreground">
                  This job may already exist in your applications.
                </p>
                <ul className="space-y-2 pt-3">
                  {duplicates.map((app) => (
                    <li key={app.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[13px] text-muted-foreground">
                        {app.job_title} — {app.company}
                      </span>
                      <Link to="/applications/$id" params={{ id: app.id }}>
                        <RetroButton size="sm">OPEN EXISTING</RetroButton>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="pt-3">
                  <RetroButton size="sm" onClick={() => setDuplicates(null)}>
                    SAVE ANYWAY
                  </RetroButton>
                </div>
              </Panel>
            ) : null}

            <Panel title="REVIEW EXTRACTED INFORMATION">
              <p className="font-sans text-[13px] text-muted-foreground">
                Everything below is editable. Correct anything the AI misread, then save.
              </p>
            </Panel>

            <ReviewForm draft={draft} onChange={setDraft} missingFields={missingFields} />

            {rawText ? (
              <Panel title="RAW OCR TEXT">
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
                  {rawText}
                </pre>
              </Panel>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <RetroButton variant="ok" onClick={save} disabled={busy || !!duplicates}>
                {busy ? "SAVING…" : "SAVE APPLICATION"}
              </RetroButton>
              <RetroButton onClick={() => setStep("choose")} disabled={busy}>
                CANCEL
              </RetroButton>
            </div>
            {duplicates ? (
              <EmptyState>Resolve the duplicate warning above before saving.</EmptyState>
            ) : null}
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
