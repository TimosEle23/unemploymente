import { Link } from "@tanstack/react-router";
import { StatusBadge, StatusBar, Tag } from "./ui";
import type { Application } from "@/lib/jobhunt/types";

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function JobCard({ app }: { app: Application }) {
  const skills = [...app.required_skills, ...app.preferred_skills].slice(0, 6);
  return (
    <Link to="/applications/$id" params={{ id: app.id }} className="block panel hover:bg-panel-raised">
      <StatusBar status={app.status} />
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="pixel-text text-[11px] leading-5 text-foreground">{app.job_title}</h3>
          <StatusBadge status={app.status} />
        </div>
        <p className="font-mono text-[13px] text-foreground">{app.company}</p>
        <p className="font-mono text-[12px] text-muted-foreground">
          {[app.location, app.work_arrangement].filter(Boolean).join(" · ") || "Location not specified"}
        </p>
        {app.applied_at ? (
          <p className="pixel-text text-[8px] text-muted-foreground">
            APPLIED: {formatDate(app.applied_at)}
          </p>
        ) : null}
        {skills.length ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {skills.map((skill) => (
              <Tag key={skill}>{skill}</Tag>
            ))}
          </div>
        ) : null}
        <div className="grid gap-1 pt-1">
          {app.job_board ? (
            <p className="pixel-text text-[8px] text-muted-foreground">SOURCE: {app.job_board}</p>
          ) : null}
          {app.next_action ? (
            <p className="pixel-text text-[8px] text-ok">
              NEXT: {app.next_action}
              {app.next_action_date ? ` (${app.next_action_date})` : ""}
            </p>
          ) : null}
          {app.is_seed ? (
            <p className="pixel-text text-[8px] text-muted-foreground">SEED DATA</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
