import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { createLetterThread, deleteLetterThread, fetchLetterThreads } from "@/lib/jobhunt/letters";
import { RetroButton } from "./ui";

export function useLetterThreads() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["letter-threads", user?.id], queryFn: fetchLetterThreads, enabled: !!user });
}

export function LettersLayout({ activeId, children }: { activeId?: string; children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: threads = [] } = useLetterThreads();

  async function newThread() {
    if (!user) return;
    try {
      const id = await createLetterThread(user.id, {});
      await qc.invalidateQueries({ queryKey: ["letter-threads"] });
      navigate({ to: "/letters/$threadId", params: { threadId: id } });
    } catch {
      toast.error("Could not start a new letter");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this letter chat?")) return;
    await deleteLetterThread(id);
    await qc.invalidateQueries({ queryKey: ["letter-threads"] });
    if (id === activeId) navigate({ to: "/letters" });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <aside className="panel h-fit p-3">
        <div className="flex items-center justify-between gap-2 pb-3">
          <h2 className="pixel-text text-[10px] text-foreground">LETTERS</h2>
          <RetroButton variant="primary" size="sm" onClick={newThread} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> NEW LETTER
          </RetroButton>
        </div>
        {threads.length ? (
          <ul className="grid gap-1">
            {threads.map((t) => (
              <li
                key={t.id}
                className={cn(
                  "flex items-center gap-1 border border-border",
                  t.id === activeId ? "bg-foreground text-background" : "hover:bg-accent",
                )}
              >
                <Link
                  to="/letters/$threadId"
                  params={{ threadId: t.id }}
                  className="min-w-0 flex-1 break-words px-2 py-2 font-sans text-[13px] leading-5"
                >
                  {t.title}
                </Link>
                <button
                  type="button"
                  aria-label="Delete letter chat"
                  onClick={() => remove(t.id)}
                  className="px-2 py-2 opacity-70 hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-mono text-[12px] leading-5 text-muted-foreground">No letters yet.</p>
        )}
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
