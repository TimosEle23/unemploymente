import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/jobhunt/Shell";
import { EmptyState, Panel, RetroButton, StatusBadge } from "@/components/jobhunt/ui";
import { useApplications } from "@/lib/jobhunt/hooks";
import { fetchAllEvents } from "@/lib/jobhunt/api";
import { useAuth } from "@/lib/auth";
import { INTERVIEW_STATUSES } from "@/lib/jobhunt/types";

export const Route = createFileRoute("/interviews")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Interviews — Unemploymente" },
      {
        name: "description",
        content:
          "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage.",
      },
      { property: "og:title", content: "Interviews — Unemploymente" },
      {
        property: "og:description",
        content:
          "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage.",
      },
    ],
  }),
  component: InterviewsPage,
});

function InterviewsPage() {
  const { data: apps = [] } = useApplications();
  const { user } = useAuth();
  const { data: events = [] } = useQuery({
    queryKey: ["all-events", user?.id],
    queryFn: fetchAllEvents,
    enabled: !!user,
  });

  const inInterview = apps.filter((app) => INTERVIEW_STATUSES.includes(app.status));
  const interviewEvents = events.filter((event) => /INTERVIEW/i.test(event.event_type));
  const byId = new Map(apps.map((app) => [app.id, app]));

  return (
    <Shell>
      <div className="space-y-4">
        <h1 className="pixel-text text-[14px] text-foreground">INTERVIEWS</h1>

        <Panel title="IN INTERVIEW STAGE">
          {inInterview.length ? (
            <ul className="divide-y divide-border">
              {inInterview.map((app) => (
                <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <p className="font-mono text-[13px] text-foreground">
                      {app.job_title} — {app.company}
                    </p>
                    {app.next_action ? (
                      <p className="pixel-text pt-1 text-[8px] text-ok">
                        NEXT: {app.next_action} {app.next_action_date ?? ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} />
                    <Link to="/applications/$id" params={{ id: app.id }}>
                      <RetroButton size="sm">OPEN</RetroButton>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No applications are at interview stage.</EmptyState>
          )}
        </Panel>

        <Panel title="INTERVIEW TIMELINE">
          {interviewEvents.length ? (
            <ul className="space-y-2">
              {interviewEvents.map((event) => (
                <li key={event.id} className="flex flex-wrap items-baseline gap-3">
                  <span className="pixel-text w-24 text-[8px] text-muted-foreground">
                    {new Date(`${event.event_date}T00:00:00`)
                      .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                      .toUpperCase()}
                  </span>
                  <span className="pixel-text text-[9px] text-foreground">{event.event_type}</span>
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {byId.get(event.application_id)?.company ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No interview events recorded yet.</EmptyState>
          )}
        </Panel>
      </div>
    </Shell>
  );
}
