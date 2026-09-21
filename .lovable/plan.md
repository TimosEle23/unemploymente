# Connected inbox job import

## What will be added
- A new **INBOX IMPORT** area where each signed-in user can connect Gmail and/or Outlook.
- A manual **SCAN FOR JOB EMAILS** action with a selectable date range. It searches likely application, recruiter, interview, rejection, and offer messages.
- AI extraction that combines the relevant email content into structured job drafts without inventing missing details.
- Public-page enrichment: when an email contains a job link, JOBHUNT attempts to read the accessible posting from LinkedIn, Indeed, or the employer website and merge additional facts into the draft.
- A review queue. Nothing becomes an application automatically: users review, edit, reject, or save each draft.
- Duplicate checks against existing applications using company, title, URL, and source-message identity.
- Imported message context is summarized into timeline events and recruiter/contact fields while avoiding unnecessary inbox content storage.

## Safety and behavior
- Gmail and Outlook access belongs to each individual JOBHUNT user through their own consent.
- Connection credentials remain encrypted on the server and are never exposed to the browser.
- The app requests read-only email access and only retrieves messages relevant to job applications.
- Public enrichment never bypasses authentication walls, CAPTCHAs, robots restrictions, or anti-bot controls. If a page is inaccessible, the email-only draft remains available.
- LinkedIn account connection is not required for this first version; links from emails are used when publicly accessible.
- Imports remain user-initiated initially. Automatic background syncing can be added later after the review workflow proves reliable.

## Interface
- Add **INBOX IMPORT** to navigation and a compact connection status area in Settings.
- Show Gmail and Outlook connection cards with connect, reconnect, and disconnect states.
- Show scan progress, source account, message date, confidence notes, missing fields, duplicate warnings, and enrichment status.
- Reuse the existing application review form and retro visual system, with wrapping text on desktop and mobile.

## Technical details
- Link the Gmail and Microsoft Outlook App User Connector clients with offline access and read-only mail scopes.
- Add encrypted per-user connection storage plus an import-drafts table protected by user-level access rules.
- Add authenticated server functions for consent, OAuth completion, connection status, inbox search, message retrieval, AI extraction, public URL enrichment, draft dismissal, and saving.
- Add OAuth return pages for both providers and keep all provider responses and credentials server-side.
- Use provider message IDs for idempotency and store only the minimum source metadata and extracted information needed by JOBHUNT.
