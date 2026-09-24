import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

type Body = { messages?: unknown; threadId?: unknown };

function userClient(token: string) {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

type Entry = {
  title?: string | null;
  organization?: string | null;
  period?: string | null;
  summary?: string | null;
  bullets?: string[];
  technologies?: string[];
};

function entries(label: string, list: unknown) {
  if (!Array.isArray(list) || !list.length) return `${label}: (none on file)`;
  return (
    `${label}:\n` +
    (list as Entry[])
      .map((e) =>
        [
          `- ${[e.title, e.organization, e.period].filter(Boolean).join(" | ")}`,
          e.summary ? `  ${e.summary}` : "",
          ...(e.bullets ?? []).map((b) => `  • ${b}`),
          e.technologies?.length ? `  Tech: ${e.technologies.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      )
      .join("\n")
  );
}

const lines = (label: string, value: unknown) =>
  Array.isArray(value) && value.length ? `${label}:\n- ${value.join("\n- ")}` : "";

export const Route = createFileRoute("/api/letter-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (token.split(".").length !== 3) return new Response("Sign in required", { status: 401 });

        const { messages, threadId } = (await request.json()) as Body;
        if (!Array.isArray(messages) || typeof threadId !== "string") {
          return new Response("Messages and thread are required", { status: 400 });
        }
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const supabase = userClient(token);
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) return new Response("Sign in required", { status: 401 });
        const userId = userData.user.id;

        const { data: thread } = await supabase
          .from("letter_threads")
          .select("*")
          .eq("id", threadId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!thread) return new Response("Chat not found", { status: 404 });

        const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
        let jobBlock = "";
        if (thread.application_id) {
          const { data: app } = await supabase
            .from("applications")
            .select("*")
            .eq("id", thread.application_id)
            .eq("user_id", userId)
            .maybeSingle();
          if (app) {
            const a = app as Record<string, unknown>;
            jobBlock = [
              `Job title: ${a.job_title}`,
              `Company: ${a.company}`,
              a.location ? `Location: ${a.location}` : "",
              a.description ? `Description:\n${a.description}` : "",
              lines("Responsibilities", a.responsibilities),
              lines("Requirements", a.requirements),
              lines("Required skills", a.required_skills),
              lines("Preferred skills", a.preferred_skills),
            ]
              .filter(Boolean)
              .join("\n");
          }
        }
        if (thread.job_text) jobBlock += `\n\nPasted job ad:\n${thread.job_text}`;

        const p = (profile ?? {}) as Record<string, unknown>;
        const hasCv =
          [p.cv_experience, p.cv_education, p.cv_projects].some((v) => Array.isArray(v) && v.length > 0);
        const candidate = [
          p.full_name ? `Name: ${p.full_name}` : "",
          p.headline ? `Headline: ${p.headline}` : "",
          lines("Education (profile)", p.education),
          lines("Skills", p.skills),
          entries("Work experience", p.cv_experience),
          entries("Education (CV)", p.cv_education),
          entries("Projects", p.cv_projects),
        ]
          .filter(Boolean)
          .join("\n\n");

        const system = `You write tailored cover letters / motivation letters for a job seeker.
Rules:
- Use ONLY facts from the CANDIDATE section. Never invent jobs, degrees, numbers, projects or skills.
- Connect the candidate's real experience to the job's requirements. Be specific and concise (about 250-400 words unless asked otherwise).
- Output the letter in markdown-free plain paragraphs, ready to copy. Use [placeholders] for unknown details like hiring manager name.
- Follow revision requests (shorter, more formal, other language, emphasis) on the latest letter.
- If no job description is available, ask the user to paste the job ad.
${hasCv ? "" : "- The candidate has not uploaded/read their CV yet: mention once that uploading the CV on the PROFILE page and pressing READ SECTIONS FROM CV gives much better letters."}

CANDIDATE:
${candidate || "(no profile details yet)"}

JOB:
${jobBlock.trim() || "(no job selected yet — the user may paste it in the chat)"}`;

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const original = messages as UIMessage[];
        const lastUser = original[original.length - 1];
        if (lastUser?.role === "user") {
          const { error } = await supabase.from("letter_messages").upsert(
            { thread_id: threadId, user_id: userId, message_id: lastUser.id, role: "user", parts: lastUser.parts as never },
            { onConflict: "thread_id,message_id" },
          );
          if (error) console.error("save user message", error);
          if (original.length === 1 && thread.title === "New letter") {
            const text = lastUser.parts.map((part) => (part.type === "text" ? part.text : "")).join(" ").trim();
            if (text) await supabase.from("letter_threads").update({ title: text.slice(0, 60) }).eq("id", threadId);
          }
        }

        const result = streamText({
          model: lovable.responses("openai/gpt-6-astra"),
          system,
          messages: await convertToModelMessages(original),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: original,
            headers: getLovableAiGatewayResponseHeaders(undefined, {
              ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
            }),
            onFinish: async ({ responseMessage }) => {
              const { error } = await supabase.from("letter_messages").upsert(
                {
                  thread_id: threadId,
                  user_id: userId,
                  message_id: responseMessage.id,
                  role: "assistant",
                  parts: responseMessage.parts.filter((part) => part.type === "text") as never,
                },
                { onConflict: "thread_id,message_id" },
              );
              if (error) console.error("save assistant message", error);
              await supabase.from("letter_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
            },
          }),
          runIdFetch,
        );
      },
    },
  },
});
