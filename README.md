# Unemploymente — AI Job Application Tracker

**Live app:** [unemploymente.com](https://unemploymente.com)

A personal job-hunting command center for AI/ML and technical roles. Instead of typing job details into a spreadsheet, you upload screenshots of a job ad (or connect your inbox) and the system reads them, extracts every field, and files a structured application record you can track end to end.

Built and maintained by **Timos Eleftheriou** (TE23, 2026).

---

## Why it exists

Job hunting in AI/ML means high application volume, long job descriptions, and scattered sources (LinkedIn, Indeed, company career pages, recruiter emails). Generic CRMs don't fit: they require manual data entry and don't compare a posting against your actual skills.

This app solves three concrete problems:

1. **Data entry is the bottleneck** → AI reads job ads from screenshots and fills the record.
2. **Context gets lost** → every application keeps its description, requirements, notes, timeline, and original screenshots in one place.
3. **"Am I a fit?" is guesswork** → a transparent match report shows matched, partial, and missing requirements instead of a meaningless "87% match" score.

---

## Technology stack

| Layer | Choice | Why |
|---|---|---|
| Framework | TanStack Start v1 (React 19, SSR) | File-based routing, type-safe server functions, edge-ready |
| Build tool | Vite 7 | Fast HMR, modern bundling |
| Language | TypeScript (strict, ~97% of the codebase) | End-to-end type safety from database row to UI prop |
| Styling | Tailwind CSS v4 with a custom token theme | Retro terminal design system, no ad-hoc colors |
| Database | PostgreSQL (Lovable Cloud / Supabase) | Relational integrity, row-level security, SQL migrations |
| Auth | Email/password + Google OAuth 2.0, JWT sessions | Standard, multi-user ready |
| File storage | Private buckets with signed URLs | Screenshots and CVs are never publicly reachable |
| AI | Server-side gateway calls with strict JSON schemas | Structured output, no keys in the browser |

---

## Architecture at a glance

```text
Browser (React 19 + Tailwind v4)
  │  type-safe RPC (createServerFn)
  ▼
Server functions (edge runtime)
  ├── screenshot extraction  → AI gateway (vision + OCR, strict JSON schema)
  ├── CV section extraction  → AI gateway (PDF parsing)
  ├── Gmail inbox scan       → OAuth connector gateway → AI classification
  ▼
PostgreSQL  +  private object storage
  Row-Level Security on every table (users only ever see their own rows)
```

Design rules enforced across the codebase:

- **No secrets client-side.** All AI and provider credentials are read inside server handlers only.
- **RLS on every table.** Policies scope every row to `auth.uid()`; no table is readable without a policy.
- **Never invent data.** Every AI prompt is instructed to return `null` for fields not present in the source, and extraction results always pass through a human review screen before saving.
- **Encrypted third-party tokens.** Inbox connection credentials are stored AES-256-GCM encrypted, server-side only.
- **SSRF-guarded enrichment.** Outbound link fetches validate the target and refuse redirects.

---

## Data model

| Table | Purpose |
|---|---|
| `profiles` | User identity, headline, education, skills, CV path, parsed CV sections |
| `applications` | One row per job: title, company, location, salary, arrangement, status, skills, source |
| `application_events` | Timeline entries (saved, submitted, HR interview, technical interview, offer) |
| `screenshots` | Original job-ad images attached to their application |
| `notes` | Free-text notes, interview prep, recruiter context |
| `followups` | Next action plus next-action date driving reminders |
| `contacts` | Recruiter and hiring-manager details |
| `app_user_connections` | Encrypted inbox OAuth credentials (service-role access only) |
| `email_import_drafts` | Staged candidates from an inbox scan, pending human review |

All tables carry `created_at` / `updated_at` with database triggers.

---

## Feature walkthrough

### Dashboard
Pipeline snapshot: totals per status, applications this week and month, upcoming interviews, follow-ups due, and active applications. Sections: **Upcoming Actions** (today/tomorrow), **Active Applications**, **Recently Added**, and **Skills in Demand** — a live frequency chart of the skills appearing most often across your saved jobs.

### Add job — screenshot extraction (the core feature)
Upload one or several screenshots of the same posting. A server function sends them to a vision model with a strict output schema and merges them into a **single** record: title, company, location, work arrangement, employment type, salary and currency, experience and education requirements, required and preferred skills, languages, ML/cloud/framework technologies, responsibilities, benefits, deadline, posting date, job URL, recruiter and contact details, job board. Missing fields stay empty rather than being guessed. An editable review screen — with duplicate detection on company + title + URL — precedes saving. Manual entry uses the identical form.

### Connected inbox import (Gmail)
The user authorizes read-only Gmail access through an OAuth popup. A scan searches a bounded recent window with job-specific query syntax, classifies each message with AI, enriches public job links when safe, deduplicates by provider message ID, and stages results in a **Review Queue**. Nothing is ever saved automatically — every import is human-approved. Only extracted metadata is persisted, not email bodies.

### Application detail
Full record view with an inline-editable job title and a status selector that recolors the record. Sections: job description, responsibilities, requirements, technical skills, preferred skills, education, experience, benefits, my notes, interview notes, follow-up, documents, and the original screenshots.

### Timeline and follow-ups
Manually loggable events per application with dates and notes. Each application carries a next action (apply, follow up, prepare HR/technical interview, thank-you email, contact recruiter, check status) with a date that feeds the dashboard and the in-app notification bell.

### Applications list and Kanban
Search across company, title, location, skill, technology, status, and source; filters for status, work arrangement, and date. A Kanban view (Saved → Applied → HR → Technical → Final → Offer → Rejected) supports drag-and-drop, and moving a card writes the new status straight to the database.

### Match report
Job requirements are compared against the stored profile with alias and related-skill expansion, producing **matched / partially matched / missing / relevant experience / potential gaps** — a reviewable breakdown, deliberately not a single opaque percentage.

### Profile and CV toolkit
Stores education, skills, and the latest CV (private storage). A server function parses the uploaded PDF and extracts **Work Experience**, **Education**, and **Projects** using only the document's own wording. Every section, entry, bullet line, skill, and technology is click-to-copy — built for pasting into application forms fast. Also includes account email and password management.

### Analytics
Applications per week and month, breakdowns by status, company, location, and role, most-requested skills, most frequently missing skills, interview conversion, and response rate — rendered as simple, readable charts.

---

## Design system

A deliberate dark retro-computer aesthetic: near-black charcoal background, grey panels, off-white text, muted green for positive progress, muted red for rejection, grey for neutral, white for newly added. Square or barely-rounded components, pixel borders, hard shadows, no gradients or decorative animation. Pixel typography (Press Start 2P) for navigation, labels, and buttons; JetBrains Mono for metadata; Inter for long-form text. Responsive from desktop down to mobile, where navigation collapses to a single menu.

---

## Running locally

Requires Node.js 20+ (or Bun).

```sh
git clone https://github.com/TimosEle23/unemploymente.git
cd unemploymente
npm install
npm run dev
```

The app starts on `http://localhost:8080`. Backend credentials come from environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`); server-only secrets — the AI gateway key, the inbox connector key, and the connection encryption secret — are configured in the hosting environment and never shipped to the browser.

```sh
npm run build      # production build
npx tsgo --noEmit  # type check
```

---

## Project layout

```text
src/
  routes/               file-based routes (dashboard, add, applications, analytics,
                        interviews, profile, inbox import, auth, sitemap, OAuth returns)
  components/jobhunt/   design-system primitives, job card, review form,
                        match panel, CV sections, app shell
  lib/jobhunt/          types, API layer, React Query hooks, match engine,
                        server functions (extraction, CV parsing, inbox)
  integrations/         database and connector clients
  server/               encryption and connection-state helpers
  styles.css            Tailwind v4 theme tokens and utilities
supabase/               SQL migrations
```

---

## Roadmap

- Scheduled background inbox scans
- Additional mail providers (Outlook, Apple Mail)
- ATS-API job enrichment (Greenhouse, Lever, Workday)
- Exportable application reports

---

**TE23 — 2026**
