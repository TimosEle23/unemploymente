import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/jobhunt/Shell";
import { LettersLayout } from "@/components/jobhunt/LettersLayout";
import { Panel, RetroButton, inputClass } from "@/components/jobhunt/ui";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageActions, MessageAction, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { supabase } from "@/integrations/supabase/client";
import { useApplications } from "@/lib/jobhunt/hooks";
import { fetchLetterMessages, fetchLetterThread, updateLetterThread, type LetterThread } from "@/lib/jobhunt/letters";

const DESCRIPTION =
  "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage.";

export const Route = createFileRoute("/letters/$threadId")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Cover letter chat — Unemploymente" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Cover letter chat — Unemploymente" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LetterThreadPage,
});

function LetterThreadPage() {
  const { threadId } = Route.useParams();
  const thread = useQuery({ queryKey: ["letter-thread", threadId], queryFn: () => fetchLetterThread(threadId) });
  const messages = useQuery({ queryKey: ["letter-messages", threadId], queryFn: () => fetchLetterMessages(threadId) });

  return (
    <Shell>
      <LettersLayout activeId={threadId}>
        {thread.isLoading || messages.isLoading ? (
          <p className="pixel-text text-[10px] text-muted-foreground">LOADING…</p>
        ) : !thread.data ? (
          <div className="panel p-6">
            <p className="font-sans text-[14px] text-muted-foreground">This letter chat was not found.</p>
            <Link to="/letters" className="pixel-text mt-3 inline-block text-[9px] text-ok">BACK TO LETTERS</Link>
          </div>
        ) : (
          <LetterChat key={threadId} thread={thread.data} initialMessages={messages.data ?? []} />
        )}
      </LettersLayout>
    </Shell>
  );
}

function textOf(message: UIMessage) {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

function LetterChat({ thread, initialMessages }: { thread: LetterThread; initialMessages: UIMessage[] }) {
  const qc = useQueryClient();
  const { data: applications = [] } = useApplications();
  const [applicationId, setApplicationId] = useState(thread.application_id ?? "");
  const [jobText, setJobText] = useState(thread.job_text ?? "");
  const [savedJob, setSavedJob] = useState({ a: thread.application_id ?? "", t: thread.job_text ?? "" });

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/letter-chat",
        body: { threadId: thread.id },
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [thread.id],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: thread.id,
    messages: initialMessages,
    transport,
    onError: (error) => {
      const msg = error.message || "";
      if (msg.includes("402")) toast.error("AI credits are used up. Add credits in Settings → Plans & credits.");
      else if (msg.includes("429")) toast.error("Too many requests. Wait a moment and try again.");
      else toast.error(msg.slice(0, 200) || "The letter could not be written.");
    },
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["letter-threads"] });
      qc.invalidateQueries({ queryKey: ["letter-messages", thread.id] });
    },
  });

  const jobDirty = applicationId !== savedJob.a || jobText !== savedJob.t;
  const busy = status === "submitted" || status === "streaming";

  async function saveJob() {
    await updateLetterThread(thread.id, { application_id: applicationId || null, job_text: jobText.trim() || null });
    setSavedJob({ a: applicationId, t: jobText });
    qc.invalidateQueries({ queryKey: ["letter-thread", thread.id] });
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    if (jobDirty) await saveJob();
    await sendMessage({ text: text.trim() });
  }

  useEffect(() => {
    document.querySelector<HTMLTextAreaElement>("textarea[name='message']")?.focus();
  }, [status]);

  const hasJob = !!(savedJob.a || savedJob.t.trim());

  return (
    <div className="grid gap-4">
      <Panel title="JOB">
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="pixel-text text-[8px] text-muted-foreground">PICK A SAVED JOB</span>
            <select className={inputClass} value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
              <option value="">— none —</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.job_title} — {app.company}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="pixel-text text-[8px] text-muted-foreground">OR PASTE THE JOB AD</span>
            <textarea
              className={`${inputClass} min-h-24`}
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the job description here…"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <RetroButton size="sm" variant="ghost" onClick={saveJob} disabled={!jobDirty}>
              {jobDirty ? "SAVE JOB" : "JOB SAVED"}
            </RetroButton>
            {!messages.length ? (
              <RetroButton
                size="sm"
                variant="primary"
                disabled={busy || !(applicationId || jobText.trim())}
                onClick={() => send("Write a cover letter for this job based on my CV.")}
              >
                WRITE COVER LETTER
              </RetroButton>
            ) : null}
          </div>
        </div>
      </Panel>

      <div className="panel flex h-[65vh] min-h-[420px] flex-col">
        <Conversation className="flex-1">
          <ConversationContent>
            {!messages.length ? (
              <ConversationEmptyState
                title="NO LETTER YET"
                description={
                  hasJob
                    ? "Press WRITE COVER LETTER or type your own request below."
                    : "Choose a saved job or paste the job ad above, then ask for a letter."
                }
              />
            ) : (
              messages.map((message) => {
                const text = textOf(message);
                return (
                  <Message key={message.id} from={message.role}>
                    <MessageContent
                      className={
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-none"
                          : "bg-transparent text-foreground font-sans text-[14px] leading-6"
                      }
                    >
                      {message.role === "assistant" ? <MessageResponse>{text}</MessageResponse> : <p className="whitespace-pre-wrap">{text}</p>}
                    </MessageContent>
                    {message.role === "assistant" && text ? (
                      <MessageActions>
                        <MessageAction
                          tooltip="Copy letter"
                          label="Copy letter"
                          onClick={async () => {
                            await navigator.clipboard.writeText(text);
                            toast.success("Letter copied");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </MessageAction>
                      </MessageActions>
                    ) : null}
                  </Message>
                );
              })
            )}
            {status === "submitted" ? <Shimmer className="font-mono text-[13px]">Writing your letter…</Shimmer> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="border-t border-border p-3">
          <PromptInput onSubmit={(msg) => send(msg.text ?? "")}>
            <PromptInputTextarea name="message" placeholder="Ask for a letter or a change: shorter, more formal, in Greek…" />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
