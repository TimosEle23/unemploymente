import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Mail, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/jobhunt/Shell";
import { ReviewForm, type Draft } from "@/components/jobhunt/ReviewForm";
import { EmptyState, Field, Panel, RetroButton, Tag, inputClass } from "@/components/jobhunt/ui";
import { useAuth } from "@/lib/auth";
import { useApplications } from "@/lib/jobhunt/hooks";
import { addEvent, createApplication, dismissEmailImportDraft, fetchEmailImportDrafts, findDuplicates, markEmailImportDraftSaved } from "@/lib/jobhunt/api";
import { completeInboxConnection, disconnectInbox, getInboxConnectionStatus, scanJobEmails, startInboxConnection } from "@/lib/jobhunt/inbox.functions";
import { emptyExtraction, type EmailImportDraft } from "@/lib/jobhunt/types";

type ConnectorId = "google_mail" | "microsoft_outlook";

export const Route = createFileRoute("/inbox-import")({
  head: () => ({
    meta: [
      { title: "Inbox import — JOBHUNT" },
      { name: "description", content: "Connect an inbox, find job-related emails, and review extracted applications before saving." },
      { property: "og:title", content: "Inbox import — JOBHUNT" },
      { property: "og:description", content: "Review job applications extracted from your connected inbox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InboxImportPage,
});

function waitForOAuth(popup: Window, connectorId: ConnectorId) {
  return new Promise<string>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== popup || event.data?.connectorId !== connectorId) return;
      if (event.data?.type !== "appUserConnectorOAuthComplete" && event.data?.type !== "appUserConnectorOAuthFailed") return;
      cleanup();
      if (event.data.type === "appUserConnectorOAuthComplete" && typeof event.data.code === "string") {
        resolve(event.data.code);
      } else {
        reject(new Error("Account connection did not finish."));
      }
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The connection window closed before completion."));
    }, 500);
  });
}

function toReviewDraft(item: EmailImportDraft): Draft {
  return {
    ...emptyExtraction(),
    ...item.extracted_job,
    status: "NEW",
    applied_at: null,
    next_action: null,
    next_action_date: null,
    notes: item.message_subject ? `Imported from email: ${item.message_subject}` : null,
  };
}

function InboxImportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: applications = [] } = useApplications();
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ item: EmailImportDraft; draft: Draft } | null>(null);

  const statusFn = useServerFn(getInboxConnectionStatus);
  const startFn = useServerFn(startInboxConnection);
  const completeFn = useServerFn(completeInboxConnection);
  const disconnectFn = useServerFn(disconnectInbox);
  const scanFn = useServerFn(scanJobEmails);
  const status = useQuery({ queryKey: ["inbox-connections", user?.id], queryFn: () => statusFn(), enabled: Boolean(user) });
  const drafts = useQuery({ queryKey: ["email-import-drafts", user?.id], queryFn: fetchEmailImportDrafts, enabled: Boolean(user) });

  async function connect(connectorId: ConnectorId) {
    const popup = window.open("", "jobhunt-account-connect", "width=600,height=720");
    if (!popup) { toast.error("Allow popups, then try again"); return; }
    setBusy(`connect-${connectorId}`);
    try {
      const result = await startFn({ data: { connectorId } });
      if (!result.configured) {
        popup.close();
        toast.error(`${connectorId === "google_mail" ? "Gmail" : "Outlook"} is not available yet`);
        return;
      }
      const completion = waitForOAuth(popup, connectorId);
      popup.location.href = result.authorizationUrl;
      const code = await completion;
      await completeFn({ data: { code, connectorId } });
      await status.refetch();
      toast.success(`${connectorId === "google_mail" ? "Gmail" : "Outlook"} connected`);
    } catch (error) {
      popup.close();
      toast.error(error instanceof Error ? error.message : "Could not connect account");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(connectorId: ConnectorId) {
    setBusy(`disconnect-${connectorId}`);
    try {
      await disconnectFn({ data: { connectorId } });
      await status.refetch();
      toast.success("Inbox disconnected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disconnect inbox");
    } finally {
      setBusy(null);
    }
  }

  async function scan() {
    setBusy("scan");
    try {
      const result = await scanFn({ data: { connectorId: "google_mail", days } });
      await drafts.refetch();
      toast.success(result.imported ? `${result.imported} job email${result.imported === 1 ? "" : "s"} ready to review` : "No new job emails found");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inbox scan failed", { duration: 9000 });
      await status.refetch();
    } finally {
      setBusy(null);
    }
  }

  async function dismiss(item: EmailImportDraft) {
    await dismissEmailImportDraft(item.id);
    if (editing?.item.id === item.id) setEditing(null);
    await drafts.refetch();
    toast.success("Email removed from review");
  }

  async function save() {
    if (!user || !editing) return;
    if (!editing.draft.job_title?.trim() || !editing.draft.company?.trim()) {
      toast.error("Job title and company are required");
      return;
    }
    const duplicate = findDuplicates(applications, editing.draft);
    if (duplicate.length) {
      toast.error("Possible duplicate found. Open the existing application below first.");
      return;
    }
    setBusy(`save-${editing.item.id}`);
    try {
      const application = await createApplication(user.id, {
        ...editing.draft,
        job_title: editing.draft.job_title.trim(),
        company: editing.draft.company.trim(),
        extraction_source: `EMAIL_${editing.item.connector_id.toUpperCase()}`,
      });
      await addEvent(user.id, application.id, {
        event_type: "NOTE",
        event_date: (editing.item.received_at ?? new Date().toISOString()).slice(0, 10),
        notes: `Inbox import: ${editing.item.message_subject || "job-related email"}${editing.item.sender_email ? ` from ${editing.item.sender_email}` : ""}`,
      });
      await markEmailImportDraftSaved(editing.item.id, application.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["applications"] }),
        drafts.refetch(),
      ]);
      toast.success("Application saved from inbox");
      navigate({ to: "/applications/$id", params: { id: application.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save application");
    } finally {
      setBusy(null);
    }
  }

  const pending = drafts.data ?? [];
  const duplicateMatches = editing ? findDuplicates(applications, editing.draft) : [];
  return (
    <Shell>
      <div className="space-y-5">
        <div>
          <p className="pixel-text text-[8px] text-ok">CONNECTED SOURCES</p>
          <h1 className="pixel-text mt-2 text-[16px] leading-7 text-foreground">INBOX IMPORT</h1>
          <p className="mt-2 max-w-3xl font-sans text-[13px] leading-6 text-muted-foreground">
            Find application, recruiter, interview, rejection, offer, and job-posting emails. Every result waits here for your review before it becomes an application.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ConnectionCard
            name="GMAIL"
            connected={Boolean(status.data?.gmail)}
            reconnect={Boolean(status.data?.gmail?.reconnect_required)}
            busy={busy !== null}
            onConnect={() => connect("google_mail")}
            onDisconnect={() => disconnect("google_mail")}
          />
          <ConnectionCard
            name="OUTLOOK"
            connected={Boolean(status.data?.outlook)}
            reconnect={Boolean(status.data?.outlook?.reconnect_required)}
            available={Boolean(status.data?.outlookConfigured)}
            busy={busy !== null}
            onConnect={() => connect("microsoft_outlook")}
            onDisconnect={() => disconnect("microsoft_outlook")}
          />
        </div>

        <Panel title="SCAN FOR JOB EMAILS">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="DATE RANGE" className="w-full max-w-48">
              <select className={inputClass} value={days} onChange={(event) => setDays(Number(event.target.value))}>
                <option value={7}>LAST 7 DAYS</option>
                <option value={30}>LAST 30 DAYS</option>
                <option value={60}>LAST 60 DAYS</option>
                <option value={90}>LAST 90 DAYS</option>
              </select>
            </Field>
            <RetroButton variant="ok" onClick={scan} disabled={!status.data?.gmail || busy !== null}>
              <RefreshCw className="h-3 w-3" /> {busy === "scan" ? "SCANNING…" : "SCAN GMAIL"}
            </RetroButton>
          </div>
          <p className="mt-3 font-mono text-[11px] leading-5 text-muted-foreground">
            Only extracted job details and minimal source information are kept. Nothing is saved automatically.
          </p>
        </Panel>

        <Panel title={`REVIEW QUEUE // ${pending.length}`}>
          {drafts.isLoading ? <EmptyState>LOADING EMAIL RESULTS…</EmptyState> : pending.length ? (
            <div className="divide-y divide-border">
              {pending.map((item) => {
                const job = item.extracted_job;
                return (
                  <article key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-1.5">
                          <Tag tone="fresh">{item.connector_id === "google_mail" ? "GMAIL" : "OUTLOOK"}</Tag>
                          <Tag tone={item.enrichment_status === "ENRICHED" ? "ok" : "neutral"}>{item.enrichment_status.replace(/_/g, " ")}</Tag>
                        </div>
                        <h2 className="mt-3 break-words font-sans text-[17px] font-semibold leading-6 text-foreground">{job.job_title || "TITLE NEEDS REVIEW"}</h2>
                        <p className="mt-1 break-words font-mono text-[12px] leading-5 text-muted-foreground">{job.company || "COMPANY NEEDS REVIEW"} · {item.message_subject || "NO SUBJECT"}</p>
                        <p className="mt-1 break-words font-mono text-[11px] leading-5 text-muted-foreground">{item.sender_email || "UNKNOWN SENDER"}{item.received_at ? ` · ${new Date(item.received_at).toLocaleDateString()}` : ""}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <RetroButton size="sm" variant="primary" onClick={() => setEditing({ item, draft: toReviewDraft(item) })}>REVIEW</RetroButton>
                        <RetroButton size="sm" variant="ghost" onClick={() => dismiss(item)}>DISMISS</RetroButton>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <EmptyState>NO EMAILS WAITING FOR REVIEW.</EmptyState>}
        </Panel>

        {editing ? (
          <div className="space-y-4 border-t-2 border-foreground pt-5">
            <Panel title="REVIEW EMAIL EXTRACTION">
              <p className="break-words font-sans text-[13px] leading-6 text-muted-foreground">Source: {editing.item.message_subject || "Email without subject"}. Correct any missing or inaccurate detail before saving.</p>
            </Panel>
            {duplicateMatches.length ? (
              <Panel title="POSSIBLE DUPLICATE">
                <div className="space-y-2">
                  {duplicateMatches.map((app) => <Link key={app.id} to="/applications/$id" params={{ id: app.id }} className="flex flex-wrap items-center justify-between gap-2 border border-border p-2 font-mono text-[12px] text-foreground"><span>{app.job_title} — {app.company}</span><span className="pixel-text text-[8px] text-ok">OPEN EXISTING</span></Link>)}
                </div>
              </Panel>
            ) : null}
            <ReviewForm draft={editing.draft} onChange={(draft) => setEditing({ ...editing, draft })} missingFields={editing.item.missing_fields} />
            <div className="flex flex-wrap gap-2">
              <RetroButton variant="ok" onClick={save} disabled={busy !== null || duplicateMatches.length > 0}>{busy === `save-${editing.item.id}` ? "SAVING…" : "SAVE APPLICATION"}</RetroButton>
              <RetroButton onClick={() => setEditing(null)} disabled={busy !== null}>CANCEL</RetroButton>
              <RetroButton variant="bad" onClick={() => dismiss(editing.item)} disabled={busy !== null}>DISMISS EMAIL</RetroButton>
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function ConnectionCard({ name, connected, reconnect, available = true, busy, onConnect, onDisconnect }: { name: string; connected: boolean; reconnect: boolean; available?: boolean; busy: boolean; onConnect: () => void; onDisconnect: () => void }) {
  return (
    <Panel title={name} action={<Tag tone={connected && !reconnect ? "ok" : "neutral"}>{connected && !reconnect ? "CONNECTED" : reconnect ? "RECONNECT" : "NOT CONNECTED"}</Tag>}>
      <div className="flex items-start gap-3">
        {name === "GMAIL" ? <Mail className="mt-0.5 h-5 w-5 shrink-0 text-foreground" /> : <Inbox className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />}
        <div className="min-w-0 flex-1">
          <p className="font-sans text-[13px] leading-5 text-muted-foreground">{available ? `Read job-related messages from your own ${name === "GMAIL" ? "Google" : "Microsoft"} inbox.` : "This account option has not been enabled for JOBHUNT yet."}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {connected && !reconnect ? <RetroButton size="sm" variant="ghost" onClick={onDisconnect} disabled={busy}><Unplug className="h-3 w-3" /> DISCONNECT</RetroButton> : <RetroButton size="sm" variant="ok" onClick={onConnect} disabled={busy || !available}><ShieldCheck className="h-3 w-3" /> {reconnect ? "RECONNECT" : "CONNECT"}</RetroButton>}
          </div>
        </div>
      </div>
    </Panel>
  );
}