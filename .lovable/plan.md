# Cover Letter AI Chat

A new **LETTERS** page where you chat with an AI that writes motivation/cover letters from your CV and a job description.

## What you get
- **LETTERS** in the top menu. Left: list of your letter chats + "NEW LETTER". Right: the chat.
- Each chat has its own page link, so reloading or switching keeps the right conversation. Everything saves to your account.
- When starting a chat, choose the job:
  - **Pick a saved job** from your applications (title, company, requirements, skills, description used automatically), or
  - **Paste the job ad text** directly into the chat.
- The AI uses your profile (headline, education, skills) and the WORK EXPERIENCE / EDUCATION / PROJECTS read from your CV. If your CV sections are empty, it tells you to upload your CV on PROFILE first.
- Ask for changes in plain words: "shorter", "more formal", "in Greek", "focus on NLP projects". It only uses facts from your CV — never invents experience.
- **COPY LETTER** button on each AI reply; a "WRITE COVER LETTER" button on each application's page opens a new chat already linked to that job.
- Same retro look: pixel headings, your messages in a solid bubble, AI replies as plain text, "Thinking..." while it writes.

## Technical details
- Tables `letter_threads` (user_id, title, application_id nullable, job_text nullable, timestamps) and `letter_messages` (thread_id, user_id, role, parts jsonb, created_at); grants + four own-row RLS policies each; add both to export/delete account.
- Routes: `src/routes/letters/index.tsx` (list, create → navigate), `src/routes/letters/$threadId.tsx` (chat), `src/routes/api/chat.ts` streaming route verifying the bearer token and thread ownership, loading profile + CV sections + linked job server-side into the system prompt, saving messages in `onFinish`.
- Model `openai/gpt-6-astra` via Responses API, streaming, reasoning low, `store: false`.
- AI Elements (conversation, message, prompt-input, shimmer) for the chat UI; errors (402/429) shown as toasts.
- Nav item added in Shell; button on `applications/$id.tsx`.
