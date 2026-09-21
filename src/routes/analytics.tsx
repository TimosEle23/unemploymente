import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/jobhunt/Shell";
import { EmptyState, Panel, Stat } from "@/components/jobhunt/ui";
import { useApplications, useProfile } from "@/lib/jobhunt/hooks";
import { buildMatchReport } from "@/lib/jobhunt/match";
import { INTERVIEW_STATUSES, STATUS_LABEL, STATUSES, type Application } from "@/lib/jobhunt/types";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — JOBHUNT" },
      {
        name: "description",
        content:
          "Application statistics per week and month, status breakdown, most requested skills and interview conversion.",
      },
      { property: "og:title", content: "Analytics — JOBHUNT" },
      {
        property: "og:description",
        content: "Retro styled analytics for your AI / ML job search: volume, status, skills, conversion.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function countBy(apps: Application[], pick: (app: Application) => string | null) {
  const counter = new Map<string, number>();
  for (const app of apps) {
    const key = (pick(app) ?? "").trim() || "Not specified";
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }
  return [...counter.entries()].sort((a, b) => b[1] - a[1]);
}

function Bars({ rows, tone = "ok" }: { rows: [string, number][]; tone?: "ok" | "neutral" | "bad" }) {
  if (!rows.length) return <EmptyState>No data yet.</EmptyState>;
  const max = Math.max(...rows.map(([, value]) => value));
  return (
    <ul className="space-y-2">
      {rows.map(([label, value]) => (
        <li key={label} className="flex items-center gap-2">
          <span className="w-40 shrink-0 truncate font-mono text-[12px] text-foreground">{label}</span>
          <span
            className={
              tone === "ok" ? "h-3 bg-ok" : tone === "bad" ? "h-3 bg-bad" : "h-3 bg-neutral"
            }
            style={{ width: `${Math.max((value / max) * 100, 4)}%` }}
          />
          <span className="pixel-text text-[8px] text-muted-foreground">{value}</span>
        </li>
      ))}
    </ul>
  );
}

function isoWeek(date: Date) {
  const target = new Date(date.getTime());
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week =
    1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function AnalyticsPage() {
  const { data: apps = [] } = useApplications();
  const { data: profile } = useProfile();

  const perWeek = useMemo(
    () => countBy(apps, (app) => isoWeek(new Date(app.created_at))).sort((a, b) => (a[0] < b[0] ? -1 : 1)),
    [apps],
  );
  const perMonth = useMemo(
    () => countBy(apps, (app) => app.created_at.slice(0, 7)).sort((a, b) => (a[0] < b[0] ? -1 : 1)),
    [apps],
  );
  const byStatus = useMemo(
    () =>
      STATUSES.map((status) => [
        STATUS_LABEL[status],
        apps.filter((app) => app.status === status).length,
      ] as [string, number]).filter(([, value]) => value > 0),
    [apps],
  );
  const byCompany = useMemo(() => countBy(apps, (app) => app.company).slice(0, 10), [apps]);
  const byLocation = useMemo(() => countBy(apps, (app) => app.location).slice(0, 10), [apps]);
  const byRole = useMemo(() => countBy(apps, (app) => app.job_title).slice(0, 10), [apps]);

  const skillCounts = useMemo(() => {
    const counter = new Map<string, number>();
    for (const app of apps) {
      for (const skill of new Set([...app.required_skills, ...app.preferred_skills])) {
        const key = skill.trim();
        if (key) counter.set(key, (counter.get(key) ?? 0) + 1);
      }
    }
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [apps]);

  const missingCounts = useMemo(() => {
    const counter = new Map<string, number>();
    for (const app of apps) {
      for (const skill of buildMatchReport(app, profile ?? null).missing) {
        counter.set(skill, (counter.get(skill) ?? 0) + 1);
      }
    }
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [apps, profile]);

  const appliedCount = apps.filter((app) => app.status !== "SAVED" && app.status !== "NEW").length;
  const interviewCount = apps.filter(
    (app) => INTERVIEW_STATUSES.includes(app.status) || app.status === "OFFER",
  ).length;
  const respondedCount = apps.filter(
    (app) =>
      INTERVIEW_STATUSES.includes(app.status) || app.status === "OFFER" || app.status === "REJECTED",
  ).length;
  const pct = (value: number, total: number) =>
    total ? `${Math.round((value / total) * 100)}%` : "—";

  return (
    <Shell>
      <div className="space-y-4">
        <h1 className="pixel-text text-[14px] text-foreground">ANALYTICS</h1>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="APPLICATIONS SENT" value={appliedCount} />
          <Stat label="REACHED INTERVIEW" value={interviewCount} tone="ok" />
          <Stat label="INTERVIEW CONVERSION" value={pct(interviewCount, appliedCount)} tone="ok" />
          <Stat label="RESPONSE RATE" value={pct(respondedCount, appliedCount)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="APPLICATIONS PER WEEK">
            <Bars rows={perWeek} />
          </Panel>
          <Panel title="APPLICATIONS PER MONTH">
            <Bars rows={perMonth} />
          </Panel>
          <Panel title="BY STATUS">
            <Bars rows={byStatus} tone="neutral" />
          </Panel>
          <Panel title="BY COMPANY">
            <Bars rows={byCompany} tone="neutral" />
          </Panel>
          <Panel title="BY LOCATION">
            <Bars rows={byLocation} tone="neutral" />
          </Panel>
          <Panel title="BY ROLE">
            <Bars rows={byRole} tone="neutral" />
          </Panel>
          <Panel title="MOST REQUESTED SKILLS">
            <Bars rows={skillCounts} />
          </Panel>
          <Panel title="SKILLS I AM MISSING MOST">
            <Bars rows={missingCounts} tone="bad" />
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
