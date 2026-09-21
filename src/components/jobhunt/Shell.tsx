import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Plus, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { RetroButton } from "./ui";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "DASHBOARD", to: "/" },
  { label: "APPLICATIONS", to: "/applications" },
  { label: "ADD JOB", to: "/add" },
  { label: "INTERVIEWS", to: "/interviews" },
  { label: "ANALYTICS", to: "/analytics" },
  { label: "SETTINGS", to: "/settings" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const path = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-border bg-panel">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="block">
            <h1 className="pixel-text text-[18px] text-foreground sm:text-[22px]">JOBHUNT</h1>
            <p className="pixel-text pt-1 text-[8px] text-muted-foreground">
              AI / ML APPLICATION TRACKER
            </p>
          </Link>
          <div className="flex items-center gap-2">
            <RetroButton variant="primary" onClick={() => navigate({ to: "/add" })}>
              <Plus className="h-3 w-3" /> ADD JOB
            </RetroButton>
            {user ? (
              <RetroButton
                variant="ghost"
                size="sm"
                title="Sign out"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth" });
                }}
              >
                <LogOut className="h-3 w-3" />
              </RetroButton>
            ) : null}
            <RetroButton
              variant="ghost"
              className="md:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label="Menu"
            >
              <Menu className="h-4 w-4" />
            </RetroButton>
          </div>
        </div>
        <nav
          className={cn(
            "mx-auto max-w-7xl border-t border-border px-4 md:block",
            open ? "block" : "hidden",
          )}
        >
          <ul className="flex flex-col md:flex-row md:flex-wrap">
            {NAV.map((item) => {
              const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "pixel-text block border-b border-border px-3 py-3 text-[9px] md:border-b-0 md:border-r",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5">
        {loading ? (
          <p className="pixel-text text-[10px] text-muted-foreground">LOADING…</p>
        ) : user ? (
          children
        ) : (
          <SignedOutNotice />
        )}
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2">
        <p className="pixel-text text-[8px] text-muted-foreground">
          JOBHUNT // PERSONAL JOB HUNTING SYSTEM
        </p>
      </footer>
    </div>
  );
}

function SignedOutNotice() {
  return (
    <div className="panel p-6">
      <h2 className="pixel-text text-[12px] text-foreground">SIGN IN REQUIRED</h2>
      <p className="pt-3 font-sans text-[13px] text-muted-foreground">
        Your applications are stored privately in your own account.
      </p>
      <div className="pt-4">
        <Link to="/auth">
          <RetroButton variant="primary">GO TO SIGN IN</RetroButton>
        </Link>
      </div>
    </div>
  );
}
