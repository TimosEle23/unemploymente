import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, Plus, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import inviteFriendsIcon from "@/assets/invite-friends.png.asset.json";
import { RetroButton } from "./ui";
import { cn } from "@/lib/utils";
import { useApplications } from "@/lib/jobhunt/hooks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const { data: applications = [] } = useApplications();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [notificationsReadAt, setNotificationsReadAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setNotificationsReadAt(localStorage.getItem(`jobhunt-notifications-read-${user.id}`));
  }, [user]);

  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7);
    return applications
      .filter((app) => app.next_action && app.next_action_date)
      .filter((app) => {
        const due = new Date(`${app.next_action_date}T00:00:00`);
        return due <= limit;
      })
      .sort((a, b) => (a.next_action_date ?? "").localeCompare(b.next_action_date ?? ""));
  }, [applications]);

  const unreadCount = notifications.filter(
    (item) => !notificationsReadAt || item.updated_at > notificationsReadAt,
  ).length;

  function markAllRead() {
    if (!user) return;
    const now = new Date().toISOString();
    localStorage.setItem(`jobhunt-notifications-read-${user.id}`, now);
    setNotificationsReadAt(now);
  }

  async function shareJobhunt() {
    const shareData = {
      title: "JOBHUNT",
      text: "Track AI and ML job applications with JOBHUNT.",
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy the invite link");
    }
  }

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
            <RetroButton
              variant="ok"
              size="sm"
              onClick={shareJobhunt}
              aria-label="Invite friends"
              title="Invite friends"
              className="gap-1.5"
            >
              <img
                src={inviteFriendsIcon.url}
                alt=""
                aria-hidden="true"
                className="h-5 w-5 object-contain"
              />
              <span className="hidden sm:inline">INVITE FRIENDS</span>
            </RetroButton>
            <RetroButton variant="primary" onClick={() => navigate({ to: "/add" })}>
              <Plus className="h-3 w-3" /> ADD JOB
            </RetroButton>
            {user ? (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <RetroButton variant="ghost" size="sm" title="Notifications" aria-label="Notifications" className="relative">
                      <Bell className="h-4 w-4" />
                      {unreadCount ? (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-ok px-1 font-mono text-[9px] text-ok-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      ) : null}
                    </RetroButton>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={10}
                    collisionPadding={16}
                    className="w-[calc(100vw-2rem)] max-w-md rounded-none border-border bg-panel p-0 shadow-none hard-shadow"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-3">
                      <h2 className="pixel-text text-[10px] text-ok">NOTIFICATIONS</h2>
                      <RetroButton variant="ghost" size="sm" onClick={markAllRead}>MARK ALL READ</RetroButton>
                    </div>
                    {notifications.length ? (
                      <ul className="max-h-[24rem] divide-y divide-border overflow-y-auto">
                        {notifications.map((item) => {
                          const unread = !notificationsReadAt || item.updated_at > notificationsReadAt;
                          return (
                            <li key={item.id} className={cn("px-3 py-3", !unread && "opacity-60")}>
                              <Link to="/applications/$id" params={{ id: item.id }} className="block min-w-0" onClick={markAllRead}>
                                <p className="break-words font-sans text-[14px] font-semibold leading-5 text-foreground">
                                  {item.next_action} — {item.job_title}
                                </p>
                                <p className="mt-1 break-words font-mono text-[12px] leading-5 text-muted-foreground">
                                  {item.company} · {notificationDate(item.next_action_date)}
                                </p>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="break-words p-5 font-mono text-[12px] leading-5 text-muted-foreground">No actions due in the next seven days.</p>
                    )}
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <RetroButton variant="ghost" size="sm" title="Profile and account" aria-label="Profile and account">
                      <UserRound className="h-4 w-4" />
                    </RetroButton>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 rounded-none border-border bg-background p-0 shadow-none hard-shadow">
                    <div className="border-b border-border p-3">
                      <p className="pixel-text text-[9px] text-foreground">MY ACCOUNT</p>
                      <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="grid p-2">
                      <Link to="/settings" className="pixel-text px-2 py-2 text-[8px] text-foreground hover:bg-accent">EDIT PROFILE & ACCOUNT</Link>
                      <button className="pixel-text flex items-center gap-2 px-2 py-2 text-left text-[8px] text-muted-foreground hover:bg-accent hover:text-foreground" onClick={async () => {
                        await supabase.auth.signOut();
                        navigate({ to: "/auth" });
                      }}>
                        <LogOut className="h-3 w-3" /> SIGN OUT
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
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

function notificationDate(value: string | null) {
  if (!value) return "DATE NOT SET";
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return `OVERDUE · ${value}`;
  if (days === 0) return "TODAY";
  if (days === 1) return "TOMORROW";
  return value;
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
