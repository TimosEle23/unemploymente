import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shell } from "@/components/jobhunt/Shell";
import { Field, Panel, RetroButton, Tag, inputClass } from "@/components/jobhunt/ui";
import { useApplications, useProfile } from "@/lib/jobhunt/hooks";
import { deleteSeedApplications, updateProfile } from "@/lib/jobhunt/api";
import { insertSeedData } from "@/lib/jobhunt/seed";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "My profile — JOBHUNT" },
      {
        name: "description",
        content: "Store your education and technical skills so JOBHUNT can compare them against job requirements.",
      },
      { property: "og:title", content: "My profile — JOBHUNT" },
      {
        property: "og:description",
        content: "Your education, technical skills and example data controls for JOBHUNT.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: apps = [] } = useApplications();
  const queryClient = useQueryClient();
  const [skills, setSkills] = useState("");
  const [education, setEducation] = useState("");
  const [headline, setHeadline] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setSkills(profile.skills.join(", "));
    setEducation(profile.education.join("\n"));
    setHeadline(profile.headline ?? "");
  }, [profile]);

  const seedCount = apps.filter((app) => app.is_seed).length;

  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      await updateProfile(user.id, {
        headline,
        skills: skills.split(",").map((value) => value.trim()).filter(Boolean),
        education: education.split("\n").map((value) => value.trim()).filter(Boolean),
      });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  async function seed() {
    if (!user) return;
    setBusy(true);
    try {
      await insertSeedData(user.id);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Example applications added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add example data");
    } finally {
      setBusy(false);
    }
  }

  async function removeSeed() {
    setBusy(true);
    try {
      await deleteSeedApplications();
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Example applications deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete example data");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="space-y-4">
        <h1 className="pixel-text text-[14px] text-foreground">MY PROFILE</h1>

        <Panel title="PROFESSIONAL PROFILE">
          <div className="space-y-3">
            <Field label="HEADLINE">
              <input
                className={inputClass}
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
              />
            </Field>
            <Field label="EDUCATION (ONE PER LINE)">
              <textarea
                className={`${inputClass} min-h-20 font-sans`}
                value={education}
                onChange={(event) => setEducation(event.target.value)}
              />
            </Field>
            <Field label="TECHNICAL SKILLS (COMMA SEPARATED)">
              <textarea
                className={`${inputClass} min-h-24 font-sans`}
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
              />
            </Field>
            <div className="flex flex-wrap gap-1">
              {(profile?.skills ?? []).map((skill) => (
                <Tag key={skill}>{skill}</Tag>
              ))}
            </div>
            <RetroButton variant="ok" onClick={save} disabled={busy}>
              SAVE PROFILE
            </RetroButton>
          </div>
        </Panel>

        <Panel title="EXAMPLE (SEED) DATA">
          <p className="font-sans text-[13px] text-muted-foreground">
            {seedCount
              ? `${seedCount} example applications are loaded. They are marked SEED DATA on their cards.`
              : "Load five fictional example applications to explore the interface."}
          </p>
          <div className="flex flex-wrap gap-2 pt-3">
            <RetroButton onClick={seed} disabled={busy}>
              LOAD EXAMPLE DATA
            </RetroButton>
            <RetroButton variant="bad" onClick={removeSeed} disabled={busy || !seedCount}>
              DELETE EXAMPLE DATA
            </RetroButton>
          </div>
        </Panel>

        <Panel title="ACCOUNT">
          <p className="font-mono text-[12px] text-muted-foreground">{user?.email}</p>
        </Panel>
      </div>
    </Shell>
  );
}
