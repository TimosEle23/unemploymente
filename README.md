# Job Hunt Console

Build a full responsive web application called JOBHUNT for tracking my AI and Machine Learning job applications.

The website is a personal job application management dashboard. I am a Computer Engineer with a BSc in Computer Engineering and an MSc in Artificial Intelligence, currently looking for AI Engineer, Machine Learning Engineer, Data Scientist, Applied AI and related technical roles.

The application should feel like a personal job hunting command center rather than a generic CRM.

1. Visual design

Use a dark retro computer interface inspired by classic Atari and early computer systems.

Main background:
Very dark charcoal / black grey.

Use:
Black
Dark grey
Grey
Off white
White
Muted green
Muted red

Avoid modern gradients, glassmorphism, excessive rounded cards, neon cyberpunk styling or overly polished SaaS aesthetics.

The interface should feel like a combination of:
retro computer terminal
Atari era UI
old school job tracking system
modern professional dashboard

Typography should have a pixel / retro computer feeling, especially for:
navigation
section titles
status labels
buttons
small metadata

Use a readable modern font for longer descriptions and extracted job information if necessary, while keeping the navigation and UI labels retro styled.

Use subtle pixel borders, hard shadows and square or slightly rounded components.

Do not make everything excessively pixelated. The application must remain professional and usable.

2. Main dashboard

The homepage should be the job application dashboard.

At the top display:

JOBHUNT

AI / ML APPLICATION TRACKER

Below this, show a compact navigation bar:

DASHBOARD
APPLICATIONS
ADD JOB
INTERVIEWS
ANALYTICS
SETTINGS

The main dashboard should contain statistics such as:

TOTAL APPLICATIONS
SAVED
APPLIED
INTERVIEW
TECHNICAL
OFFER
REJECTED

Also show:

Applications this week
Applications this month
Upcoming interviews
Follow ups due
Active applications

3. Application status colors

Every job application must have a clear status.

Use these colors consistently:

GREEN = positive / active progress

GREY = saved, not yet applied, waiting or neutral

RED = rejected

WHITE = newly added / needs review

Do not use bright neon colors.

Each job card should have a visible status indicator.

Suggested statuses:

SAVED
APPLIED
HR INTERVIEW
TECHNICAL INTERVIEW
FINAL INTERVIEW
OFFER
REJECTED
WITHDRAWN

Allow the user to change the status easily.

The card should visually change according to the status.

4. Add job through screenshot upload

The most important feature is an UPLOAD JOB SCREENSHOT button.

I should be able to upload one or multiple screenshots containing a job advertisement.

The system should use AI / OCR to analyze the uploaded image and extract all useful information from the job advertisement.

For example, if I upload screenshots from LinkedIn, Indeed, company career pages or other job boards, the application should identify and extract:

Job title
Company
Location
Remote / hybrid / onsite
Employment type
Salary
Currency
Required experience
Education requirements
Required technical skills
Preferred technical skills
Programming languages
Machine learning technologies
Cloud technologies
Frameworks
Responsibilities
Requirements
Qualifications
Benefits
Application deadline
Job posting date
Job URL if visible
Recruiter information if visible
Contact information if visible
Job board
Any other relevant information visible in the screenshots

If multiple screenshots belong to the same job, combine the information into one application rather than creating duplicate jobs.

After extraction, show a REVIEW SCREEN before saving.

The extracted information must be editable.

Example:

JOB TITLE
Machine Learning Engineer

COMPANY
Example Company

LOCATION
Amsterdam, Netherlands

WORK TYPE
Hybrid

SALARY
€45,000 to €60,000

REQUIRED SKILLS
Python
PyTorch
Machine Learning
SQL
Docker

PREFERRED SKILLS
AWS
Kubernetes
MLOps

Then provide:

SAVE APPLICATION

The user must be able to correct anything the AI extracted before saving.

5. Job application card

Each application should appear as a compact but information rich card.

Example:

MACHINE LEARNING ENGINEER

Company Name

Amsterdam, Netherlands
Hybrid

STATUS: APPLIED

Applied: 18 September 2026

Skills:
Python
PyTorch
Docker
SQL
AWS

SOURCE:
LinkedIn

NEXT ACTION:
Follow up with recruiter

Clicking the card should open the complete application page.

6. Application detail page

Each job should have its own detailed page.

Display:

Job title
Company
Location
Salary
Employment type
Work arrangement
Job URL
Source
Date added
Application date
Current status
Recruiter
Contact information

Then sections:

JOB DESCRIPTION

RESPONSIBILITIES

REQUIREMENTS

TECHNICAL SKILLS

PREFERRED SKILLS

EDUCATION

EXPERIENCE

BENEFITS

MY NOTES

INTERVIEW NOTES

FOLLOW UP

DOCUMENTS

SCREENSHOTS

The original uploaded screenshots should remain attached to the application so I can refer back to the original job advertisement.

7. Application timeline

Every application should have a timeline.

Example:

18 SEP
JOB SAVED

19 SEP
APPLICATION SUBMITTED

22 SEP
HR INTERVIEW

26 SEP
TECHNICAL INTERVIEW

The user should be able to manually add timeline events.

Each event should have:

Date
Event type
Notes

8. Follow up system

Each application should have a next action.

Examples:

Apply
Follow up
Prepare HR interview
Prepare technical interview
Send thank you email
Contact recruiter
Check application status

Allow me to assign:

NEXT ACTION DATE

The dashboard should show upcoming actions.

For example:

TODAY
Follow up with Company A

TOMORROW
Prepare technical interview for Company B

FRIDAY
Send recruiter message to Company C

9. Search and filtering

Add a powerful search bar.

I should be able to search by:

Company
Job title
Location
Skill
Technology
Status
Source

Add filters:

ALL
SAVED
APPLIED
INTERVIEW
OFFER
REJECTED

Also allow filtering by:

Remote
Hybrid
Onsite

and by date.

10. Job matching

Add a section called:

MY PROFILE

Store my professional profile:

BSc Computer Engineering
MSc Artificial Intelligence

Technical skills:

Python
PyTorch
TensorFlow
scikit-learn
NumPy
pandas
Machine Learning
Deep Learning
NLP
Reinforcement Learning
Computer Engineering
Data Mining
Time Series
AI

The application should compare the extracted job requirements against my profile.

For every job show:

MATCHED SKILLS

MISSING SKILLS

RELEVANT EXPERIENCE

POTENTIAL GAPS

IMPORTANT:

Do not give a simplistic overall score such as "87% match".

Instead, show a transparent comparison of the requirements.

Example:

MATCHED

Python
PyTorch
Machine Learning
Deep Learning

MISSING

AWS
Kubernetes

PARTIALLY MATCHED

MLOps

This should help me decide whether I need to apply or prepare for specific requirements.

11. Application notes

Allow free text notes for every application.

Examples:

Why I want this role

Questions about the company

Recruiter information

Interview preparation

Technical topics to study

Salary discussion

Things to mention during interview

12. Analytics

Create an ANALYTICS page.

Show useful statistics:

Applications per week
Applications per month
Applications by status
Applications by company
Applications by location
Applications by role
Most common required skills
Skills I am missing most frequently
Interview conversion
Application response rate

Use simple retro styled charts.

Do not make the analytics page visually overwhelming.

13. Kanban view

Add an optional Kanban view.

Columns:

SAVED
APPLIED
HR
TECHNICAL
FINAL
OFFER
REJECTED

Job cards should be draggable between columns.

When a card moves to another column, update the application status automatically.

14. Multiple screenshot processing

The upload system should support multiple screenshots at once.

For example:

Screenshot 1 contains the job title and company.

Screenshot 2 contains responsibilities.

Screenshot 3 contains requirements.

The AI should combine all screenshots into one structured job record.

If information is not present, leave the field empty instead of inventing information.

Never hallucinate missing job information.

15. Duplicate detection

Before saving a job, check whether a similar application already exists.

Use combinations such as:

Company
Job title
Job URL

If a likely duplicate is detected, display:

POSSIBLE DUPLICATE

This job may already exist in your applications.

Then allow:

OPEN EXISTING
SAVE ANYWAY

16. Data persistence

All applications must persist between sessions.

Use a proper database and authentication so that my job applications are not lost when I refresh the page.

The application should be designed primarily for one user, but structure the database cleanly so authentication and multiple users can be supported later.

Store:

users
applications
application_events
screenshots
notes
skills
contacts
followups

Use timestamps for created_at and updated_at.

17. Dashboard layout

The dashboard should prioritize what I need when actively searching for jobs.

Top:

JOBHUNT

Stats row:

TOTAL
ACTIVE
INTERVIEWS
OFFERS
REJECTED

Then:

UPCOMING ACTIONS

Then:

ACTIVE APPLICATIONS

Then:

RECENTLY ADDED

Then:

SKILLS IN DEMAND

The ADD JOB button should always be clearly visible.

18. Add Job button

Make this the primary action.

Button:

ADD JOB

When clicked, show:

UPLOAD SCREENSHOT

or

ENTER MANUALLY

The manual form should contain the same fields as the AI extraction workflow.

19. AI extraction workflow

The flow should be:

Click ADD JOB

Upload one or multiple screenshots

OCR / AI reads the screenshots

Extract structured information

Detect duplicate jobs

Display extracted information

User reviews and edits

User clicks SAVE

Application appears on dashboard

Original screenshots are stored with the application

The extracted data should be structured rather than stored only as raw text.

20. Responsive design

The application must work well on:

Desktop
Laptop
Tablet
Mobile

Desktop should be the primary experience because I will use it mainly on my laptop.

On mobile, the navigation should collapse into a simple menu.

21. UX principles

Keep the interface fast and direct.

Do not add unnecessary animations.

Do not use excessive rounded cards.

Do not use generic corporate dashboard aesthetics.

Do not use gradients.

Do not use stock images.

Do not add unnecessary decorative elements.

The retro aesthetic should come from typography, borders, spacing, colors and interface structure rather than random pixel art.

The application should feel like a serious personal tool with a retro computer identity.

22. Seed data

Create several realistic example applications so I can immediately understand the interface.

Examples:

Machine Learning Engineer
AI Engineer
Data Scientist
Computer Vision Engineer
NLP Engineer

Use fictional companies for seed data.

Clearly mark seed data so it can be deleted.

23. Important technical requirement

Build the application so the screenshot extraction functionality is actually connected to an AI / OCR workflow rather than being a fake UI.

If an AI API key or integration is required, create the appropriate secure backend structure and environment variable configuration.

Never expose API keys in frontend code.

For uploaded images, process the image securely and associate the extracted information with the correct application.

24. Final product identity

Application name:

JOBHUNT

Subtitle:

AI / ML APPLICATION TRACKER

Visual identity:

Dark charcoal background
Grey panels
White text
Muted green for active / positive statuses
Muted red for rejected
Grey for neutral states
White for new applications
Retro computer typography
Pixel inspired navigation
Minimal professional layout

The final result should feel like I built my own personal job hunting operating system.

Prioritize the actual job tracking workflow and screenshot to structured data extraction over decorative design.///Now make the screenshot extraction feature functional. When I upload a job advertisement screenshot, use OCR and an LLM vision model to extract the job information into the application's structured database fields. Do not simply save the screenshot or return raw OCR text. Create structured JSON internally, validate the fields, detect missing information, and show me an editable review screen before saving. If a field cannot be identified from the screenshot, return null or leave it empty. Never invent information. Support multiple screenshots belonging to the same job and merge their information before presenting the review screen.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://unemploymentet.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/08707db9-577a-4748-8833-7f0e5f837a2e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
