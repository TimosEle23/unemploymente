import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shell } from "@/components/jobhunt/Shell";
import { JobCard } from "@/components/jobhunt/JobCard";
import { EmptyState, Panel, RetroButton, StatusBadge, inputClass } from "@/components/jobhunt/ui";
import { useApplications } from "@/lib/jobhunt/hooks";
import { setStatus } from "@/lib/jobhunt/api";
import { useAuth } from "@/lib/auth";
import {
  INTERVIEW_STATUSES,
  KANBAN_COLUMNS,
  WORK_ARRANGEMENTS,
  type Application,
  type Status,
} from "@/lib/jobhunt/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/applications/")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Applications — Unemploymente" },
      {
        name: "description",
        content:
          "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage.",
      },
      { property: "og:title", content: "Applications — Unemploymente" },
      {
        property: "og:description",
        content:
          "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage.",
      },
    ],
  }),
  component: ApplicationsPage,
});

const FILTERS = ["ALL", "SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(app: Application, filter: Filter) {
  switch (filter) {
    case "ALL":
      return true;
    case "SAVED":
      return app.status === "SAVED" || app.status === "NEW";
    case "APPLIED":
      return app.status === "APPLIED";
    case "INTERVIEW":
      return INTERVIEW_STATUSES.includes(app.status);
    case "OFFER":
      return app.status === "OFFER";
    case "REJECTED":
      return app.status === "REJECTED" || app.status === "WITHDRAWN";
  }
}

function ApplicationsPage() {
  const { data: apps = [], isLoading } = useApplications();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [arrangement, setArrangement] = useState("");
  const [since, setSince] = useState("");
  const [view, setView] = useState<"LIST" | "KANBAN">("LIST");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (!matchesFilter(app, filter)) return false;
      if (arrangement && (app.work_arrangement ?? "") !== arrangement) return false;
      if (since && app.created_at.slice(0, 10) < since) return false;
      if (!needle) return true;
      const haystack = [
        app.job_title,
        app.company,
        app.location,
        app.status,
        app.job_board,
        app.work_arrangement,
        ...app.required_skills,
        ...app.preferred_skills,
        ...app.programming_languages,
        ...app.ml_technologies,
        ...app.cloud_technologies,
        ...app.frameworks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [apps, query, filter, arrangement, since]);

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="pixel-text text-[14px] text-foreground">APPLICATIONS</h1>
          <div className="flex gap-2">
            <RetroButton
              size="sm"
              variant={view === "LIST" ? "primary" : "default"}
              onClick={() => setView("LIST")}
            >
              LIST
            </RetroButton>
            <RetroButton
              size="sm"
              variant={view === "KANBAN" ? "primary" : "default"}
              onClick={() => setView("KANBAN")}
            >
              KANBAN
            </RetroButton>
          </div>
        </div>

        <Panel title="SEARCH & FILTER">
          <input
            className={inputClass}
            placeholder="Search company, title, location, skill, technology, status, source…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2 pt-3">
            {FILTERS.map((value) => (
              <RetroButton
                key={value}
                size="sm"
                variant={filter === value ? "primary" : "default"}
                onClick={() => setFilter(value)}
              >
                {value}
              </RetroButton>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-3">
            <RetroButton
              size="sm"
              variant={arrangement === "" ? "primary" : "default"}
              onClick={() => setArrangement("")}
            >
              ANY LOCATION TYPE
            </RetroButton>
            {WORK_ARRANGEMENTS.map((value) => (
              <RetroButton
                key={value}
                size="sm"
                variant={arrangement === value ? "primary" : "default"}
                onClick={() => setArrangement(value)}
              >
                {value.toUpperCase()}
              </RetroButton>
            ))}
            <label className="flex items-center gap-2">
              <span className="pixel-text text-[8px] text-muted-foreground">ADDED SINCE</span>
              <input
                type="date"
                className={inputClass}
                value={since}
                onChange={(event) => setSince(event.target.value)}
              />
            </label>
          </div>
        </Panel>

        {isLoading ? (
          <EmptyState>Loading…</EmptyState>
        ) : view === "LIST" ? (
          filtered.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((app) => (
                <JobCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <EmptyState>No applications match these filters.</EmptyState>
          )
        ) : (
          <KanbanBoard apps={filtered} />
        )}
      </div>
    </Shell>
  );
}

function KanbanBoard({ apps }: { apps: Application[] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  async function drop(columnStatus: Status) {
    const app = apps.find((item) => item.id === dragId);
    setDragId(null);
    setOverColumn(null);
    if (!app || !user || app.status === columnStatus) return;
    try {
      await setStatus(user.id, app, columnStatus);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(`${app.company} → ${columnStatus.replace(/_/g, " ")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status");
    }
  }

  return (
    <div className="grid gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-7">
      {KANBAN_COLUMNS.map((column) => {
        const items = apps.filter((app) => column.statuses.includes(app.status));
        return (
          <div
            key={column.key}
            onDragOver={(event) => {
              event.preventDefault();
              setOverColumn(column.key);
            }}
            onDragLeave={() => setOverColumn((value) => (value === column.key ? null : value))}
            onDrop={() => drop(column.key as Status)}
            className={cn("panel-flat min-h-40 p-2", overColumn === column.key && "bg-panel-raised")}
          >
            <h2 className="pixel-text border-b border-border pb-2 text-[8px] text-muted-foreground">
              {column.label} ({items.length})
            </h2>
            <div className="space-y-2 pt-2">
              {items.map((app) => (
                <article
                  key={app.id}
                  draggable
                  onDragStart={() => setDragId(app.id)}
                  className="panel-flat cursor-grab bg-panel p-2 active:cursor-grabbing"
                >
                  <p className="font-mono text-[12px] text-foreground">{app.job_title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{app.company}</p>
                  <div className="pt-2">
                    <StatusBadge status={app.status} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
