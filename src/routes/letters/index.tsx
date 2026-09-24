import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shell } from "@/components/jobhunt/Shell";
import { LettersLayout } from "@/components/jobhunt/LettersLayout";
import { RetroButton } from "@/components/jobhunt/ui";
import { useAuth } from "@/lib/auth";
import { createLetterThread } from "@/lib/jobhunt/letters";

const DESCRIPTION =
  "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage.";

export const Route = createFileRoute("/letters/")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Cover letters — Unemploymente" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Cover letters — Unemploymente" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LettersIndex,
});

function LettersIndex() {
  return (
    <Shell>
      <LettersLayout>
        <StartPanel />
      </LettersLayout>
    </Shell>
  );
}

function StartPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function start() {
    if (!user) return;
    setBusy(true);
    try {
      const id = await createLetterThread(user.id, {});
      navigate({ to: "/letters/$threadId", params: { threadId: id } });
    } catch {
      toast.error("Could not start a new letter");
      setBusy(false);
    }
  }

  return (
    <div className="panel p-6">
      <h2 className="pixel-text text-[12px] text-foreground">COVER LETTER WRITER</h2>
      <p className="pt-3 font-sans text-[14px] leading-6 text-muted-foreground">
        Pick one of your saved jobs or paste a job ad, and the AI writes a motivation / cover letter using only the
        experience, education and projects from your CV. Then ask for changes: shorter, more formal, another language.
      </p>
      <div className="pt-4">
        <RetroButton variant="primary" onClick={start} disabled={busy}>
          START A NEW LETTER
        </RetroButton>
      </div>
    </div>
  );
}
