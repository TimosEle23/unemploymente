import { toast } from "sonner";
import { Copy } from "lucide-react";
import type { CvEntry } from "@/lib/jobhunt/types";
import { Panel, RetroButton, Tag } from "./ui";

export function entryToText(entry: CvEntry) {
  const header = [entry.title, entry.organization].filter(Boolean).join(" — ");
  const meta = [entry.period, entry.location].filter(Boolean).join(" | ");
  const lines = [header, meta, entry.summary ?? "", ...entry.bullets.map((bullet) => `• ${bullet}`)];
  if (entry.technologies.length) lines.push(`Technologies: ${entry.technologies.join(", ")}`);
  return lines.filter(Boolean).join("\n");
}

export function sectionToText(entries: CvEntry[]) {
  return entries.map(entryToText).join("\n\n");
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy. Select the text and copy it manually.");
  }
}

function EntryCard({ entry }: { entry: CvEntry }) {
  const meta = [entry.period, entry.location].filter(Boolean).join(" | ");
  return (
    <div className="border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {entry.title ? (
            <p className="pixel-text break-words text-[9px] leading-relaxed text-foreground">{entry.title}</p>
          ) : null}
          {entry.organization ? (
            <p className="break-words font-mono text-[12px] text-ok">{entry.organization}</p>
          ) : null}
          {meta ? <p className="pixel-text mt-1 text-[7px] text-muted-foreground">{meta}</p> : null}
        </div>
        <RetroButton size="sm" onClick={() => copy(entryToText(entry), entry.title ?? "Entry")}>
          <Copy className="h-3 w-3" /> COPY
        </RetroButton>
      </div>
      {entry.summary ? (
        <p className="mt-2 break-words font-sans text-[13px] leading-relaxed text-muted-foreground">{entry.summary}</p>
      ) : null}
      {entry.bullets.length ? (
        <ul className="mt-2 space-y-1">
          {entry.bullets.map((bullet, index) => (
            <li key={`${bullet}-${index}`} className="flex gap-2 font-sans text-[13px] leading-relaxed text-foreground">
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                className="min-w-0 cursor-copy break-words text-left hover:text-ok"
                title="Copy this line"
                onClick={() => copy(bullet, "Line")}
              >
                {bullet}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {entry.technologies.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.technologies.map((tech) => (
            <Tag key={tech} copyText={tech}>
              {tech}
            </Tag>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CvSection({
  title,
  entries,
  emptyHint,
}: {
  title: string;
  entries: CvEntry[];
  emptyHint: string;
}) {
  return (
    <Panel title={title}>
      {entries.length ? (
        <div className="space-y-3">
          <RetroButton size="sm" variant="ok" onClick={() => copy(sectionToText(entries), title)}>
            <Copy className="h-3 w-3" /> COPY WHOLE SECTION
          </RetroButton>
          {entries.map((entry, index) => (
            <EntryCard key={`${entry.title ?? "entry"}-${index}`} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="break-words font-sans text-[13px] leading-relaxed text-muted-foreground">{emptyHint}</p>
      )}
    </Panel>
  );
}
