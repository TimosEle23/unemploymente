import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ENTRY_FIELDS = ["title", "organization", "period", "location", "summary", "bullets", "technologies"] as const;

function entrySchema() {
  return {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: ["string", "null"] },
        organization: { type: ["string", "null"] },
        period: { type: ["string", "null"] },
        location: { type: ["string", "null"] },
        summary: { type: ["string", "null"] },
        bullets: { type: "array", items: { type: "string" } },
        technologies: { type: "array", items: { type: "string" } },
      },
      required: [...ENTRY_FIELDS],
    },
  };
}

const SYSTEM_PROMPT = `You extract structured sections from a CV / resume document.
Return three lists: work experience, education and projects.
Rules:
- Use ONLY what is written in the document. NEVER invent, guess or embellish anything.
- Keep the original wording of bullet points and summaries; do not translate or rewrite.
- title: the job title, degree name or project name. organization: employer, university or (for projects) the context if stated.
- period: exactly as written (e.g. "Jan 2022 - Present"). location: only when stated.
- bullets: the individual bullet points / achievement lines for that entry, as separate short strings.
- technologies: concrete tools, languages and frameworks mentioned for that entry only.
- If a field is not present, return null (or an empty array for lists).
- Keep entries in the same order as the document, most recent first if the document does.`;

type RawEntry = {
  title?: unknown;
  organization?: unknown;
  period?: unknown;
  location?: unknown;
  summary?: unknown;
  bullets?: unknown;
  technologies?: unknown;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || /^(n\/?a|unknown|not specified|null)$/i.test(trimmed)) return null;
  return trimmed;
}

function cleanArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function cleanEntries(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is RawEntry => !!entry && typeof entry === "object")
    .map((entry) => ({
      title: cleanString(entry.title),
      organization: cleanString(entry.organization),
      period: cleanString(entry.period),
      location: cleanString(entry.location),
      summary: cleanString(entry.summary),
      bullets: cleanArray(entry.bullets),
      technologies: cleanArray(entry.technologies),
    }))
    .filter((entry) => entry.title || entry.organization || entry.summary || entry.bullets.length);
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

async function readStructuredResponse(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream from AI gateway");
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let completedText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as { type?: string; delta?: string; response?: { output_text?: string } };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") text += event.delta;
        if (event.type === "response.completed" && event.response?.output_text) completedText = event.response.output_text;
      } catch {
        // ignore keep-alive frames
      }
    }
  }
  return (text || completedText).trim();
}

export const extractCvSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("cv_file_name, cv_storage_path")
      .eq("id", context.userId)
      .single();
    if (profileError) throw new Error("Could not read your profile.");

    const path = (profile as { cv_storage_path?: string | null } | null)?.cv_storage_path;
    const fileName = (profile as { cv_file_name?: string | null } | null)?.cv_file_name ?? "cv.pdf";
    if (!path) throw new Error("Upload your latest CV first.");
    if (!/\.pdf$/i.test(fileName) && !/\.pdf$/i.test(path)) {
      throw new Error("Reading sections currently works with PDF CVs. Upload your CV as a PDF.");
    }

    const { data: file, error: downloadError } = await context.supabase.storage.from("profile-cvs").download(path);
    if (downloadError || !file) throw new Error("Could not open your stored CV.");

    const base64 = toBase64(await file.arrayBuffer());

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        instructions: SYSTEM_PROMPT,
        reasoning: { effort: "low" },
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "Extract the work experience, education and projects from this CV." },
              { type: "input_file", filename: fileName, file_data: `data:application/pdf;base64,${base64}` },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "cv_sections",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                experience: entrySchema(),
                education: entrySchema(),
                projects: entrySchema(),
              },
              required: ["experience", "education", "projects"],
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 402) throw new Error("AI credits are exhausted. Top up credits and try again.");
      if (res.status === 429) throw new Error("The AI service is rate limited right now. Try again in a moment.");
      throw new Error(`Reading the CV failed (${res.status}). ${detail.slice(0, 200)}`);
    }

    const output = await readStructuredResponse(res);
    if (!output) throw new Error("The AI returned no readable data for this CV.");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(output) as Record<string, unknown>;
    } catch {
      throw new Error("The AI response could not be parsed as structured data.");
    }

    const experience = cleanEntries(parsed["experience"]);
    const education = cleanEntries(parsed["education"]);
    const projects = cleanEntries(parsed["projects"]);

    const { error: saveError } = await context.supabase
      .from("profiles")
      .update({
        cv_experience: experience as never,
        cv_education: education as never,
        cv_projects: projects as never,
        cv_sections_updated_at: new Date().toISOString(),
      })
      .eq("id", context.userId);
    if (saveError) throw new Error("Could not save the extracted CV sections.");

    return { experience, education, projects };
  });
