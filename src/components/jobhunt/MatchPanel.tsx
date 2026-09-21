import { Panel, Tag } from "./ui";
import { buildMatchReport } from "@/lib/jobhunt/match";
import type { Application, Profile } from "@/lib/jobhunt/types";

export function MatchPanel({ app, profile }: { app: Application; profile: Profile | null }) {
  const report = buildMatchReport(app, profile);
  return (
    <Panel title="PROFILE COMPARISON" bodyClassName="space-y-4">
      <Group label="MATCHED" tone="ok" items={report.matched} empty="No overlap detected" />
      <Group label="PARTIALLY MATCHED" tone="neutral" items={report.partial} empty="None" />
      <Group label="MISSING" tone="bad" items={report.missing} empty="Nothing missing" />
      <div>
        <h3 className="pixel-text pb-2 text-[8px] text-muted-foreground">RELEVANT EXPERIENCE</h3>
        <ul className="space-y-1 font-sans text-[13px] text-foreground">
          {report.relevantExperience.length ? (
            report.relevantExperience.map((item) => <li key={item}>• {item}</li>)
          ) : (
            <li className="text-muted-foreground">Not enough profile data</li>
          )}
        </ul>
      </div>
      <div>
        <h3 className="pixel-text pb-2 text-[8px] text-muted-foreground">POTENTIAL GAPS</h3>
        <ul className="space-y-1 font-sans text-[13px] text-foreground">
          {report.gaps.length ? (
            report.gaps.map((item) => <li key={item}>• {item}</li>)
          ) : (
            <li className="text-muted-foreground">No obvious gaps</li>
          )}
        </ul>
      </div>
    </Panel>
  );
}

function Group({
  label,
  items,
  tone,
  empty,
}: {
  label: string;
  items: string[];
  tone: "ok" | "bad" | "neutral";
  empty: string;
}) {
  return (
    <div>
      <h3 className="pixel-text pb-2 text-[8px] text-muted-foreground">{label}</h3>
      {items.length ? (
        <div className="flex flex-wrap gap-1">
          {items.map((item) => (
            <Tag key={item} tone={tone} copyText={item}>
              {item}
            </Tag>
          ))}
        </div>
      ) : (
        <p className="font-mono text-[12px] text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}
