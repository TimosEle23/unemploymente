import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/jobhunt/Shell";
import { MatchPanel } from "@/components/jobhunt/MatchPanel";
import {
  EmptyState,
  Field,
  Panel,
  RetroButton,
  StatusBadge,
  StatusBar,
  Tag,
  inputClass,
} from "@/components/jobhunt/ui";
import {
  addEvent,
  addFollowup,
  addNote,
  deleteApplication,
  deleteEvent,
  deleteNote,
  fetchApplication,
  fetchEvents,
  fetchFollowups,
  fetchNotes,
  fetchScreenshots,
  setStatus,
  signedScreenshotUrl,
  toggleFollowup,
  updateApplication,
  uploadScreenshots,
} from "@/lib/jobhunt/api";
import { useProfile } from "@/lib/jobhunt/hooks";
import { useAuth } from "@/lib/auth";
import {
  EVENT_TYPES,
  NEXT_ACTIONS,
  STATUSES,
  STATUS_LABEL,
  type Screenshot,
  type Status,
} from "@/lib/jobhunt/types";

export const Route = createFileRoute("/applications/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Application detail — Unemploymente" },
      {
        name: "description",
        content:
          "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage.",
      },
      { property: "og:title", content: "Application detail — Unemploymente" },
      {
        property: "og:description",
        content:
          "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage.",
      },
    ],
  }),
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const { data: app, isLoading, error } = useQuery({
    queryKey: ["application", id],
    queryFn: () => fetchApplication(id),
    enabled: !!user,
  });
  const { data: events = [] } = useQuery({
    queryKey: ["events", id],
    queryFn: () => fetchEvents(id),
    enabled: !!user,
  });
  const { data: notes = [] } = useQuery({
    queryKey: ["notes", id],
    queryFn: () => fetchNotes(id),
    enabled: !!user,
  });
  const { data: followups = [] } = useQuery({
    queryKey: ["followups", id],
    queryFn: () => fetchFollowups(id),
    enabled: !!user,
  });
  const { data: screenshots = [] } = useQuery({
    queryKey: ["screenshots", id],
    queryFn: () => fetchScreenshots(id),
    enabled: !!user,
  });

  const [eventDraft, setEventDraft] = useState({
    event_date: new Date().toISOString().slice(0, 10),
    event_type: EVENT_TYPES[0] as string,
    notes: "",
  });
  const [noteDraft, setNoteDraft] = useState({ category: "GENERAL", content: "" });
  const [followDraft, setFollowDraft] = useState({ action: NEXT_ACTIONS[0] as string, due_date: "" });
  const [editingTitle, setEditingTitle] = useState(false);
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    if (!editingTitle && app?.job_title) setJobTitle(app.job_title);
  }, [app?.job_title, editingTitle]);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["application", id] }),
      queryClient.invalidateQueries({ queryKey: ["applications"] }),
      queryClient.invalidateQueries({ queryKey: ["events", id] }),
      queryClient.invalidateQueries({ queryKey: ["notes", id] }),
      queryClient.invalidateQueries({ queryKey: ["followups", id] }),
      queryClient.invalidateQueries({ queryKey: ["screenshots", id] }),
    ]);

  if (isLoading) {
    return (
      <Shell>
        <EmptyState>Loading…</EmptyState>
      </Shell>
    );
  }
  if (error || !app) {
    return (
      <Shell>
        <Panel title="NOT FOUND">
          <p className="font-sans text-[13px] text-muted-foreground">
            This application could not be loaded.
          </p>
          <div className="pt-3">
            <Link to="/applications">
              <RetroButton>BACK TO APPLICATIONS</RetroButton>
            </Link>
          </div>
        </Panel>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-4">
        <div className="panel">
          <StatusBar status={app.status} />
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editingTitle ? (
                  <div className="flex max-w-2xl items-stretch gap-2">
                    <input
                      className={`${inputClass} min-w-0 pixel-text text-[12px]`}
                      value={jobTitle}
                      autoFocus
                      aria-label="Job name"
                      onChange={(event) => setJobTitle(event.target.value)}
                      onKeyDown={async (event) => {
                        if (event.key === "Escape") {
                          setJobTitle(app.job_title);
                          setEditingTitle(false);
                        }
                        if (event.key === "Enter" && jobTitle.trim()) {
                          await updateApplication(app.id, { job_title: jobTitle.trim() });
                          await refresh();
                          setEditingTitle(false);
                          toast.success("Job name updated");
                        }
                      }}
                    />
                    <RetroButton
                      variant="ok"
                      size="sm"
                      aria-label="Save job name"
                      title="Save job name"
                      disabled={!jobTitle.trim()}
                      onClick={async () => {
                        if (!jobTitle.trim()) return;
                        await updateApplication(app.id, { job_title: jobTitle.trim() });
                        await refresh();
                        setEditingTitle(false);
                        toast.success("Job name updated");
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </RetroButton>
                    <RetroButton
                      variant="ghost"
                      size="sm"
                      aria-label="Cancel editing job name"
                      title="Cancel"
                      onClick={() => {
                        setJobTitle(app.job_title);
                        setEditingTitle(false);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </RetroButton>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <h1 className="min-w-0 break-words pixel-text text-[14px] leading-6 text-foreground">
                      {app.job_title}
                    </h1>
                    <RetroButton
                      variant="ghost"
                      size="sm"
                      aria-label="Edit job name"
                      title="Edit job name"
                      className="shrink-0"
                      onClick={() => setEditingTitle(true)}
                    >
                      <Pencil className="h-3 w-3" />
                    </RetroButton>
                  </div>
                )}
                <p className="pt-2 font-mono text-[14px] text-foreground">{app.company}</p>
                <p className="font-mono text-[12px] text-muted-foreground">
                  {[app.location, app.work_arrangement, app.employment_type].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={app.status} />
                <select
                  className={inputClass}
                  value={app.status}
                  onChange={async (event) => {
                    if (!user) return;
                    await setStatus(user.id, app, event.target.value as Status);
                    await refresh();
                    toast.success("Status updated");
                  }}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Meta label="SALARY" value={app.salary_text} />
              <Meta label="CURRENCY" value={app.currency} />
              <Meta label="SOURCE" value={app.job_board} />
              <Meta label="DATE ADDED" value={app.created_at.slice(0, 10)} />
              <Meta label="APPLICATION DATE" value={app.applied_at} />
              <Meta label="POSTED" value={app.posted_date} />
              <Meta label="DEADLINE" value={app.application_deadline} />
              <Meta label="RECRUITER" value={app.recruiter_name} />
              <Meta label="CONTACT" value={app.recruiter_contact ?? app.contact_info} />
              <Meta label="EXPERIENCE" value={app.required_experience} />
              <Meta label="EDUCATION" value={app.education_requirements} />
              <Meta
                label="JOB URL"
                value={
                  app.job_url ? (
                    <a
                      className="underline"
                      href={app.job_url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {app.job_url}
                    </a>
                  ) : null
                }
              />
            </dl>

            <div className="flex flex-wrap gap-2 pt-1">
              <select
                className={inputClass}
                style={{ maxWidth: 240 }}
                value={app.next_action ?? ""}
                onChange={async (event) => {
                  await updateApplication(app.id, { next_action: event.target.value || null });
                  await refresh();
                }}
              >
                <option value="">NEXT ACTION: —</option>
                {NEXT_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className={inputClass}
                style={{ maxWidth: 180 }}
                value={app.next_action_date ?? ""}
                onChange={async (event) => {
                  await updateApplication(app.id, { next_action_date: event.target.value || null });
                  await refresh();
                }}
              />
              <RetroButton
                variant="primary"
                size="sm"
                onClick={async () => {
                  if (!user) return;
                  const { createLetterThread } = await import("@/lib/jobhunt/letters");
                  const threadId = await createLetterThread(user.id, { application_id: app.id, title: `${app.job_title} — ${app.company}` });
                  navigate({ to: "/letters/$threadId", params: { threadId } });
                }}
              >
                WRITE COVER LETTER
              </RetroButton>
              <RetroButton
                variant="bad"
                size="sm"
                onClick={async () => {
                  if (!confirm("Delete this application?")) return;
                  await deleteApplication(app.id);
                  await refresh();
                  navigate({ to: "/applications" });
                }}
              >
                DELETE
              </RetroButton>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Panel title="JOB DESCRIPTION">
              {app.description ? (
                <p className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground">
                  {app.description}
                </p>
              ) : (
                <EmptyState>Not captured.</EmptyState>
              )}
            </Panel>
            <ListPanel title="RESPONSIBILITIES" items={app.responsibilities} />
            <ListPanel title="REQUIREMENTS" items={app.requirements} />
            <ListPanel title="QUALIFICATIONS" items={app.qualifications} />
            <ListPanel title="BENEFITS" items={app.benefits} />
            <Panel title="TECHNICAL SKILLS">
              <TagRow label="REQUIRED" items={app.required_skills} />
              <TagRow label="PROGRAMMING LANGUAGES" items={app.programming_languages} />
              <TagRow label="MACHINE LEARNING" items={app.ml_technologies} />
              <TagRow label="CLOUD" items={app.cloud_technologies} />
              <TagRow label="FRAMEWORKS" items={app.frameworks} />
            </Panel>
            <Panel title="PREFERRED SKILLS">
              <TagRow label="PREFERRED" items={app.preferred_skills} />
            </Panel>
            {app.extra_info ? (
              <Panel title="OTHER INFORMATION">
                <p className="whitespace-pre-wrap font-sans text-[13px] text-foreground">
                  {app.extra_info}
                </p>
              </Panel>
            ) : null}
          </div>

          <div className="space-y-4">
            <MatchPanel app={app} profile={profile ?? null} />

            <Panel title="TIMELINE">
              {events.length ? (
                <ul className="space-y-2 pb-3">
                  {events.map((event) => (
                    <li key={event.id} className="flex items-baseline gap-3">
                      <span className="pixel-text w-20 text-[8px] text-muted-foreground">
                        {new Date(`${event.event_date}T00:00:00`)
                          .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                          .toUpperCase()}
                      </span>
                      <span className="pixel-text text-[9px] text-foreground">{event.event_type}</span>
                      {event.notes ? (
                        <span className="font-sans text-[12px] text-muted-foreground">{event.notes}</span>
                      ) : null}
                      <button
                        className="pixel-text ml-auto text-[8px] text-muted-foreground hover:text-bad"
                        onClick={async () => {
                          await deleteEvent(event.id);
                          await refresh();
                        }}
                      >
                        X
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState>No events yet.</EmptyState>
              )}
              <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-3">
                <Field label="DATE">
                  <input
                    type="date"
                    className={inputClass}
                    value={eventDraft.event_date}
                    onChange={(event) =>
                      setEventDraft({ ...eventDraft, event_date: event.target.value })
                    }
                  />
                </Field>
                <Field label="EVENT TYPE">
                  <select
                    className={inputClass}
                    value={eventDraft.event_type}
                    onChange={(event) =>
                      setEventDraft({ ...eventDraft, event_type: event.target.value })
                    }
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="NOTES">
                  <input
                    className={inputClass}
                    value={eventDraft.notes}
                    onChange={(event) => setEventDraft({ ...eventDraft, notes: event.target.value })}
                  />
                </Field>
              </div>
              <div className="pt-2">
                <RetroButton
                  size="sm"
                  onClick={async () => {
                    if (!user) return;
                    await addEvent(user.id, app.id, {
                      event_type: eventDraft.event_type,
                      event_date: eventDraft.event_date,
                      notes: eventDraft.notes || null,
                    });
                    setEventDraft({ ...eventDraft, notes: "" });
                    await refresh();
                  }}
                >
                  ADD TIMELINE EVENT
                </RetroButton>
              </div>
            </Panel>

            <Panel title="FOLLOW UP">
              {followups.length ? (
                <ul className="space-y-2 pb-3">
                  {followups.map((followup) => (
                    <li key={followup.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={followup.done}
                        onChange={async (event) => {
                          await toggleFollowup(followup.id, event.target.checked);
                          await refresh();
                        }}
                      />
                      <span className="font-mono text-[12px] text-foreground">{followup.action}</span>
                      <span className="pixel-text text-[8px] text-muted-foreground">
                        {followup.due_date ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState>No follow ups planned.</EmptyState>
              )}
              <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-2">
                <Field label="ACTION">
                  <select
                    className={inputClass}
                    value={followDraft.action}
                    onChange={(event) => setFollowDraft({ ...followDraft, action: event.target.value })}
                  >
                    {NEXT_ACTIONS.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="DUE DATE">
                  <input
                    type="date"
                    className={inputClass}
                    value={followDraft.due_date}
                    onChange={(event) =>
                      setFollowDraft({ ...followDraft, due_date: event.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="pt-2">
                <RetroButton
                  size="sm"
                  onClick={async () => {
                    if (!user) return;
                    await addFollowup(user.id, app.id, {
                      action: followDraft.action,
                      due_date: followDraft.due_date || null,
                      notes: null,
                    });
                    await refresh();
                  }}
                >
                  ADD FOLLOW UP
                </RetroButton>
              </div>
            </Panel>

            <Panel title="MY NOTES / INTERVIEW NOTES">
              <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                <Field label="CATEGORY">
                  <select
                    className={inputClass}
                    value={noteDraft.category}
                    onChange={(event) => setNoteDraft({ ...noteDraft, category: event.target.value })}
                  >
                    {[
                      "GENERAL",
                      "WHY THIS ROLE",
                      "QUESTIONS",
                      "RECRUITER",
                      "INTERVIEW PREP",
                      "TECHNICAL TOPICS",
                      "SALARY",
                      "INTERVIEW NOTES",
                    ].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="NOTE">
                  <textarea
                    className={`${inputClass} min-h-20 font-sans`}
                    value={noteDraft.content}
                    onChange={(event) => setNoteDraft({ ...noteDraft, content: event.target.value })}
                  />
                </Field>
              </div>
              <div className="pt-2">
                <RetroButton
                  size="sm"
                  onClick={async () => {
                    if (!user || !noteDraft.content.trim()) return;
                    await addNote(user.id, app.id, noteDraft);
                    setNoteDraft({ ...noteDraft, content: "" });
                    await refresh();
                  }}
                >
                  ADD NOTE
                </RetroButton>
              </div>
              <ul className="space-y-3 pt-4">
                {notes.map((note) => (
                  <li key={note.id} className="panel-flat p-2">
                    <div className="flex items-center justify-between">
                      <span className="pixel-text text-[8px] text-muted-foreground">
                        {note.category} · {note.created_at.slice(0, 10)}
                      </span>
                      <button
                        className="pixel-text text-[8px] text-muted-foreground hover:text-bad"
                        onClick={async () => {
                          await deleteNote(note.id);
                          await refresh();
                        }}
                      >
                        X
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap pt-1 font-sans text-[13px] text-foreground">
                      {note.content}
                    </p>
                  </li>
                ))}
              </ul>
              {app.notes ? (
                <p className="whitespace-pre-wrap border-t border-border pt-3 font-sans text-[13px] text-muted-foreground">
                  {app.notes}
                </p>
              ) : null}
            </Panel>

            <Panel title="SCREENSHOTS / DOCUMENTS">
              <ScreenshotGrid screenshots={screenshots} />
              <div className="pt-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className={inputClass}
                  onChange={async (event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (!user || !files.length) return;
                    try {
                      await uploadScreenshots(user.id, app.id, files);
                      await refresh();
                      toast.success("Screenshots attached");
                    } catch (uploadError) {
                      toast.error(
                        uploadError instanceof Error ? uploadError.message : "Upload failed",
                      );
                    }
                  }}
                />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="panel-flat p-2">
      <dt className="pixel-text text-[8px] text-muted-foreground">{label}</dt>
      <dd className="break-words pt-1 font-mono text-[12px] text-foreground">{value || "—"}</dd>
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <Panel title={title}>
      {items.length ? (
        <ul className="space-y-1 font-sans text-[13px] leading-relaxed text-foreground">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : (
        <EmptyState>Not captured.</EmptyState>
      )}
    </Panel>
  );
}

function TagRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="pb-3">
      <h3 className="pixel-text pb-2 text-[8px] text-muted-foreground">{label}</h3>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <Tag key={item} copyText={item}>{item}</Tag>
        ))}
      </div>
    </div>
  );
}

function ScreenshotGrid({ screenshots }: { screenshots: Screenshot[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        screenshots.map(async (shot) => [shot.id, (await signedScreenshotUrl(shot.storage_path)) ?? ""] as const),
      );
      if (!cancelled) setUrls(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [screenshots]);

  if (!screenshots.length) return <EmptyState>No screenshots attached.</EmptyState>;

  return (
    <div className="grid grid-cols-2 gap-2">
      {screenshots.map((shot) => (
        <a
          key={shot.id}
          href={urls[shot.id] || undefined}
          target="_blank"
          rel="noreferrer noopener"
          className="panel-flat block p-1"
        >
          {urls[shot.id] ? (
            <img src={urls[shot.id]} alt={shot.file_name ?? "Job screenshot"} className="w-full" />
          ) : (
            <span className="pixel-text text-[8px] text-muted-foreground">LOADING…</span>
          )}
        </a>
      ))}
    </div>
  );
}
