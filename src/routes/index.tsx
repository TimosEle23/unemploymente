import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Shell } from "@/components/jobhunt/Shell";
import { JobCard } from "@/components/jobhunt/JobCard";
import { EmptyState, Panel, RetroButton, Stat, Tag } from "@/components/jobhunt/ui";
import { useApplications } from "@/lib/jobhunt/hooks";
import { ACTIVE_STATUSES, INTERVIEW_STATUSES, type Application } from "@/lib/jobhunt/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — JOBHUNT" },
      {
        name: "description",
        content:
          "JOBHUNT dashboard: AI and Machine Learning job application statistics, upcoming actions and active applications.",
      },
      { property: "og:title", content: "Dashboard — JOBHUNT" },
      {
        property: "og:description",
        content: "Your AI / ML job hunting command center: stats, upcoming actions, active applications.",
      },
    ],
  }),
  component: Dashboard,
});

function within(app: Application, days: number) {
  const created = new Date(app.created_at).getTime();
  return Date.now() - created <= days * 86_400_000;
}

function dayLabel(date: string) {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return "OVERDUE";
  if (diff === 0) return "TODAY";
  if (diff === 1) return "TOMORROW";
  if (diff < 7) return target.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  return target.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
}

function Dashboard() {
  const { data: apps = [], isLoading } = useApplications();

  const stats = useMemo(() => {
    const count = (predicate: (app: Application) => boolean) => apps.filter(predicate).length;
    return {
      total: apps.length,
      saved: count((app) => app.status === "SAVED"),
      applied: count((app) => app.status === "APPLIED"),
      interview: count((app) => INTERVIEW_STATUSES.includes(app.status)),
      technical: count((app) => app.status === "TECHNICAL_INTERVIEW"),
      offer: count((app) => app.status === "OFFER"),
      rejected: count((app) => app.status === "REJECTED"),
      newlyAdded: count((app) => app.status === "NEW"),
      week: count((app) => within(app, 7)),
      month: count((app) => within(app, 30)),
      active: count((app) => ACTIVE_STATUSES.includes(app.status)),
    };
  }, [apps]);

  const upcoming = useMemo(
    () =>
      apps
        .filter((app) => app.next_action && app.next_action_date)
        .sort((a, b) => (a.next_action_date! < b.next_action_date! ? -1 : 1))
        .slice(0, 8),
    [apps],
  );

  const active = apps.filter((app) => ACTIVE_STATUSES.includes(app.status)).slice(0, 6);
  const recent = apps.slice(0, 4);

  const skillsInDemand = useMemo(() => {
    const counter = new Map<string, number>();
    for (const app of apps) {
      for (const skill of [...app.required_skills, ...app.preferred_skills]) {
        const key = skill.trim();
        if (key) counter.set(key, (counter.get(key) ?? 0) + 1);
      }
    }
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [apps]);

  return (
    <Shell>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Stat label="TOTAL APPLICATIONS" value={stats.total} />
          <Stat label="SAVED" value={stats.saved} />
          <Stat label="APPLIED" value={stats.applied} tone="ok" />
          <Stat label="INTERVIEW" value={stats.interview} tone="ok" />
          <Stat label="TECHNICAL" value={stats.technical} tone="ok" />
          <Stat label="OFFER" value={stats.offer} tone="ok" />
          <Stat label="REJECTED" value={stats.rejected} tone="bad" />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="THIS WEEK" value={stats.week} />
          <Stat label="THIS MONTH" value={stats.month} />
          <Stat label="UPCOMING INTERVIEWS" value={stats.interview} tone="ok" />
          <Stat label="FOLLOW UPS DUE" value={upcoming.length} />
          <Stat label="ACTIVE" value={stats.active} tone="ok" />
        </div>

        <Panel
          title="UPCOMING ACTIONS"
          action={
            <Link to="/applications">
              <RetroButton variant="ghost" size="sm">
                ALL
              </RetroButton>
            </Link>
          }
        >
          {upcoming.length ? (
            <ul className="divide-y divide-border">
              {upcoming.map((app) => (
                <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <span className="pixel-text text-[8px] text-ok">
                      {dayLabel(app.next_action_date!)}
                    </span>
                    <p className="font-mono text-[13px] text-foreground">
                      {app.next_action} — {app.company}
                    </p>
                  </div>
                  <Link to="/applications/$id" params={{ id: app.id }}>
                    <RetroButton size="sm">OPEN</RetroButton>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No actions scheduled. Add a next action date to an application.</EmptyState>
          )}
        </Panel>

        <Panel title="ACTIVE APPLICATIONS">
          {isLoading ? (
            <EmptyState>Loading…</EmptyState>
          ) : active.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {active.map((app) => (
                <JobCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <EmptyState>
              Nothing active yet. Use ADD JOB to upload a job screenshot, or load the example data in
              SETTINGS.
            </EmptyState>
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="RECENTLY ADDED">
            {recent.length ? (
              <div className="grid gap-3">
                {recent.map((app) => (
                  <JobCard key={app.id} app={app} />
                ))}
              </div>
            ) : (
              <EmptyState>No applications yet.</EmptyState>
            )}
          </Panel>
          <Panel title="SKILLS IN DEMAND">
            {skillsInDemand.length ? (
              <ul className="space-y-2">
                {skillsInDemand.map(([skill, count]) => (
                  <li key={skill} className="flex items-start gap-2">
                    <span className="flex-1 min-w-0 break-words font-mono text-[12px] text-foreground leading-tight">{skill}</span>
                    <span className="h-3 shrink-0 bg-ok mt-0.5" style={{ width: `${Math.min(count * 28, 220)}px` }} />
                    <Tag>{count}</Tag>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>Add applications to see skill demand.</EmptyState>
            )}
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
