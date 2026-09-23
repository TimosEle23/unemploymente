import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Field, RetroButton, inputClass } from "@/components/jobhunt/ui";
import unemploymenteLogo from "@/assets/unemploymente-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Unemploymente" },
      { name: "description", content: "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage." },
      { property: "og:title", content: "Sign in — Unemploymente" },
      { property: "og:description", content: "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="pb-6 text-center">
          <img src={unemploymenteLogo} alt="Unemploymente" className="mx-auto mb-4 h-24 w-20 object-contain" />
          <h1 className="pixel-text text-[22px] text-foreground">JOBHUNT</h1>
          <p className="pixel-text pt-2 text-[8px] text-muted-foreground">
            AI / ML APPLICATION TRACKER
          </p>
        </div>
        <form onSubmit={submit} className="panel space-y-3 p-4">
          <h2 className="pixel-text text-[10px] text-foreground">
            {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </h2>
          <Field label="EMAIL">
            <input
              className={inputClass}
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="PASSWORD">
            <input
              className={inputClass}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <RetroButton type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? "WORKING…" : mode === "signin" ? "SIGN IN" : "SIGN UP"}
          </RetroButton>
          <RetroButton type="button" className="w-full" onClick={google}>
            CONTINUE WITH GOOGLE
          </RetroButton>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="pixel-text w-full pt-1 text-[8px] text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "NEED AN ACCOUNT? SIGN UP" : "ALREADY REGISTERED? SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
}
