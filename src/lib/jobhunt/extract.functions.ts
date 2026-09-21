import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  images: z
    .array(
      z.object({
        name: z.string().optional(),
        dataUrl: z.string().min(32),
      }),
    )
    .min(1)
    .max(8),
});

const STRING_FIELDS = [
  "job_title",
  "company",
  "location",
  "work_arrangement",
  "employment_type",
  "salary_text",
  "currency",
  "required_experience",
  "education_requirements",
  "description",
  "application_deadline",
  "posted_date",
  "job_url",
  "job_board",
  "recruiter_name",
  "recruiter_contact",
  "contact_info",
  "extra_info",
] as const;

const ARRAY_FIELDS = [
  "required_skills",
  "preferred_skills",
  "programming_languages",
  "ml_technologies",
  "cloud_technologies",
  "frameworks",
  "responsibilities",
  "requirements",
  "qualifications",
  "benefits",
] as const;

function jsonSchema() {
  const properties: Record<string, unknown> = {};
  for (const field of STRING_FIELDS) properties[field] = { type: ["string", "null"] };
  for (const field of ARRAY_FIELDS) properties[field] = { type: "array", items: { type: "string" } };
  properties["salary_min"] = { type: ["number", "null"] };
  properties["salary_max"] = { type: ["number", "null"] };
  properties["raw_text"] = { type: ["string", "null"] };
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: [...STRING_FIELDS, ...ARRAY_FIELDS, "salary_min", "salary_max", "raw_text"],
  };
}

const SYSTEM_PROMPT = `You are an OCR and information extraction engine for job advertisements.
You receive one or more screenshots that ALL belong to the SAME job advertisement.
Step 1: read every visible character in every screenshot (OCR).
Step 2: merge the screenshots into ONE structured job record.
Rules:
- Only use information that is actually visible in the images.
- NEVER invent, guess or infer missing information. If a field is not visible, return null (or an empty array for lists).
- Do not translate; keep the original wording for descriptions, responsibilities and requirements.
- Split responsibilities / requirements / qualifications / benefits into short individual bullet strings.
- Skills: list concrete technologies and competencies only (e.g. Python, PyTorch, SQL, AWS). Separate hard requirements (required_skills) from nice-to-haves (preferred_skills). Also classify them into programming_languages, ml_technologies, cloud_technologies and frameworks when applicable.
- Dates must be ISO format YYYY-MM-DD, otherwise null.
- salary_text keeps the salary exactly as written; salary_min / salary_max are numbers only when clearly stated; currency is a code or symbol.
- work_arrangement is one of Remote, Hybrid, Onsite or null.
- job_board is the platform the screenshot came from (LinkedIn, Indeed, company career page, ...) only if identifiable from the image.
- raw_text is the full OCR text of all screenshots concatenated.`;

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
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
        }
        if (event.type === "response.completed" && event.response?.output_text) {
          completedText = event.response.output_text;
        }
      } catch {
        // ignore keep-alive / non JSON frames
      }
    }
  }
  return (text || completedText).trim();
}

export const extractJobFromScreenshots = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const content: unknown[] = [
      {
        type: "input_text",
        text: `Extract the job advertisement from these ${data.images.length} screenshot(s). Leave anything you cannot read as null.`,
      },
      ...data.images.map((image) => ({ type: "input_image", image_url: image.dataUrl })),
    ];

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
        input: [{ role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: "job_advertisement",
            strict: true,
            schema: jsonSchema(),
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 402) {
        throw new Error("AI credits are exhausted. Top up credits and try again.");
      }
      if (res.status === 429) {
        throw new Error("The AI service is rate limited right now. Try again in a moment.");
      }
      throw new Error(`AI extraction failed (${res.status}). ${detail.slice(0, 300)}`);
    }

    const output = await readStructuredResponse(res);
    if (!output) throw new Error("The AI returned no readable data for these screenshots.");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(output) as Record<string, unknown>;
    } catch {
      throw new Error("The AI response could not be parsed as structured data.");
    }

    const cleanString = (value: unknown) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (!trimmed || /^(n\/?a|unknown|not specified|null)$/i.test(trimmed)) return null;
      return trimmed;
    };
    const cleanArray = (value: unknown) =>
      Array.isArray(value)
        ? Array.from(
            new Set(
              value
                .filter((item): item is string => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean),
            ),
          )
        : [];
    const cleanNumber = (value: unknown) => (typeof value === "number" && isFinite(value) ? value : null);

    const result: Record<string, string | number | string[] | null> = {};
    for (const field of STRING_FIELDS) result[field] = cleanString(parsed[field]);
    for (const field of ARRAY_FIELDS) result[field] = cleanArray(parsed[field]);
    result["salary_min"] = cleanNumber(parsed["salary_min"]);
    result["salary_max"] = cleanNumber(parsed["salary_max"]);

    const missingFields: string[] = [...STRING_FIELDS, ...ARRAY_FIELDS].filter((field) => {
      const value = result[field];
      return value === null || (Array.isArray(value) && value.length === 0);
    });

    return {
      extracted: result,
      rawText: cleanString(parsed["raw_text"]) ?? "",
      missingFields,
      imageCount: data.images.length,
    };
  });
