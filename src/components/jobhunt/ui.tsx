import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, type Status, type StatusTone } from "@/lib/jobhunt/types";

const toneClasses: Record<StatusTone, string> = {
  ok: "bg-ok text-ok-foreground border-ok",
  bad: "bg-bad text-bad-foreground border-bad",
  neutral: "bg-muted text-muted-foreground border-border",
  fresh: "bg-fresh text-background border-fresh",
};

const toneBar: Record<StatusTone, string> = {
  ok: "bg-ok",
  bad: "bg-bad",
  neutral: "bg-neutral",
  fresh: "bg-fresh",
};

export function statusTone(status: Status): StatusTone {
  return STATUS_TONE[status] ?? "neutral";
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "pixel-text inline-block border px-2 py-1 text-[9px] leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function StatusBar({ status }: { status: Status }) {
  return <div className={cn("h-1 w-full", toneBar[statusTone(status)])} />;
}

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-2 border-b border-border bg-panel-raised px-3 py-2">
          <h2 className="pixel-text text-[10px] text-foreground">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ok" | "bad" | "ghost";
  size?: "sm" | "md";
};

export const RetroButton = forwardRef<HTMLButtonElement, ButtonProps>(function RetroButton(
  { className, variant = "default", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "pixel-text inline-flex items-center justify-center gap-2 border transition-none select-none",
        "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "px-2 py-1.5 text-[8px]" : "px-3 py-2 text-[10px]",
        variant === "default" && "border-border bg-panel-raised text-foreground hover:bg-accent hard-shadow",
        variant === "primary" &&
          "border-foreground bg-foreground text-background hover:bg-primary/90 hard-shadow",
        variant === "ok" && "border-ok bg-ok text-ok-foreground hard-shadow",
        variant === "bad" && "border-bad bg-bad text-bad-foreground hard-shadow",
        variant === "ghost" && "border-transparent bg-transparent text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
});

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="pixel-text block pb-1 text-[8px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full border border-input bg-background px-2 py-1.5 font-mono text-[13px] text-foreground outline-none focus:border-foreground placeholder:text-muted-foreground";

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: StatusTone }) {
  return (
    <span
      className={cn(
        "inline-block border px-1.5 py-0.5 font-mono text-[11px]",
        tone === "ok" && "border-ok text-ok",
        tone === "bad" && "border-bad text-bad",
        tone === "neutral" && "border-border text-muted-foreground",
        tone === "fresh" && "border-foreground text-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <div className="panel-flat p-3">
      <div className="pixel-text text-[8px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "pixel-text pt-2 text-[16px]",
          tone === "ok" && "text-ok",
          tone === "bad" && "text-bad",
          tone === "neutral" && "text-foreground",
          tone === "fresh" && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center font-mono text-[12px] text-muted-foreground">{children}</p>;
}
