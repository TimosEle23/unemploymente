import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Shell } from "@/components/jobhunt/Shell";
import { Field, Panel, RetroButton, Tag, inputClass } from "@/components/jobhunt/ui";
import { CvSection } from "@/components/jobhunt/CvSections";
import { useApplications, useProfile } from "@/lib/jobhunt/hooks";
import { downloadLatestCv, removeLatestCv, updateProfile, uploadLatestCv } from "@/lib/jobhunt/api";
import { extractCvSections } from "@/lib/jobhunt/cv.functions";
import { useAuth } from "@/lib/auth";
import { Download, FileText, ScanText, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


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
  const [fullName, setFullName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const cvInput = useRef<HTMLInputElement>(null);
  const readCv = useServerFn(extractCvSections);


  useEffect(() => {
    if (!profile) return;
    setSkills(profile.skills.join(", "));
    setEducation(profile.education.join("\n"));
    setHeadline(profile.headline ?? "");
    setFullName(profile.full_name ?? "");
  }, [profile]);

  useEffect(() => setAccountEmail(user?.email ?? ""), [user?.email]);


  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      await updateProfile(user.id, {
        headline,
        full_name: fullName.trim() || null,
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

  async function saveEmail() {
    if (!accountEmail.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: accountEmail.trim() });
      if (error) throw error;
      toast.success("Email update requested. Check your inbox to confirm it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update email");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    if (!user?.email) return;
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (verifyError) throw new Error("Current password is incorrect");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  async function uploadCv(file?: File) {
    if (!user || !file) return;
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Use a PDF, DOC, or DOCX file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("CV must be 10MB or smaller");
      return;
    }
    setBusy(true);
    try {
      await uploadLatestCv(user.id, file, profile?.cv_storage_path);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Latest CV uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload CV");
    } finally {
      setBusy(false);
      if (cvInput.current) cvInput.current.value = "";
    }
  }

  async function readCvSections() {
    setReading(true);
    try {
      const result = await readCv();
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      const total = result.experience.length + result.education.length + result.projects.length;
      if (!total) {
        toast.error("No experience, education or projects could be read from your CV.");
      } else {
        toast.success(`Read ${result.experience.length} experience, ${result.education.length} education and ${result.projects.length} project entries`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read your CV");
    } finally {
      setReading(false);
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
            <Field label="FULL NAME">
              <input className={inputClass} value={fullName} maxLength={120} onChange={(event) => setFullName(event.target.value)} />
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
                <Tag key={skill} copyText={skill}>{skill}</Tag>
              ))}
            </div>
            <RetroButton variant="ok" onClick={save} disabled={busy}>
              SAVE PROFILE
            </RetroButton>
          </div>
        </Panel>

        <Panel title="LATEST CV">
          <input ref={cvInput} className="hidden" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => uploadCv(event.target.files?.[0])} />
          {profile?.cv_storage_path && profile.cv_file_name ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background p-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-ok" />
                <div className="min-w-0">
                  <p className="break-words font-mono text-[13px] text-foreground">{profile.cv_file_name}</p>
                  <p className="pixel-text mt-1 text-[7px] text-muted-foreground">UPDATED {profile.cv_updated_at?.slice(0, 10)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <RetroButton variant="ok" size="sm" onClick={readCvSections} disabled={reading}><ScanText className="h-3 w-3" /> {reading ? "READING CV..." : "READ SECTIONS FROM CV"}</RetroButton>
                <RetroButton size="sm" onClick={() => downloadLatestCv(profile.cv_storage_path ?? "", profile.cv_file_name ?? "CV")}><Download className="h-3 w-3" /> DOWNLOAD</RetroButton>
                <RetroButton size="sm" onClick={() => cvInput.current?.click()}><Upload className="h-3 w-3" /> REPLACE</RetroButton>

                <RetroButton variant="bad" size="sm" onClick={async () => {
                  if (!user || !profile.cv_storage_path || !window.confirm("Remove your latest CV?")) return;
                  await removeLatestCv(user.id, profile.cv_storage_path);
                  await queryClient.invalidateQueries({ queryKey: ["profile"] });
                  toast.success("CV removed");
                }}><Trash2 className="h-3 w-3" /> REMOVE</RetroButton>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-sans text-[13px] text-muted-foreground">Keep your latest CV privately attached to your account. PDF, DOC, or DOCX up to 10MB.</p>
              <RetroButton className="mt-3" variant="ok" onClick={() => cvInput.current?.click()} disabled={busy}><Upload className="h-3 w-3" /> UPLOAD CV</RetroButton>
            </div>
          )}
        </Panel>

        {profile?.cv_sections_updated_at ? (
          <p className="pixel-text text-[7px] text-muted-foreground">CV SECTIONS READ {profile.cv_sections_updated_at.slice(0, 10)}</p>
        ) : null}

        <CvSection
          title="WORK EXPERIENCE (FROM CV)"
          entries={profile?.cv_experience ?? []}
          emptyHint="Upload your CV and press READ SECTIONS FROM CV to keep your work experience here, ready to copy into applications."
        />

        <CvSection
          title="EDUCATION (FROM CV)"
          entries={profile?.cv_education ?? []}
          emptyHint="Your degrees will appear here after reading your CV, each one copyable with one click."
        />

        <CvSection
          title="PROJECTS (FROM CV)"
          entries={profile?.cv_projects ?? []}
          emptyHint="Your projects will appear here after reading your CV, so you can paste them into application forms."
        />


        <Panel title="ACCOUNT INFORMATION">
          <div className="space-y-3">
            <Field label="EMAIL">
              <input className={inputClass} type="email" maxLength={255} value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} />
            </Field>
            <RetroButton onClick={saveEmail} disabled={busy || accountEmail === user?.email}>UPDATE EMAIL</RetroButton>
          </div>
        </Panel>

        <Panel title="CHANGE PASSWORD">
          {user?.app_metadata?.provider !== "email" && !user?.identities?.some((identity) => identity.provider === "email") ? (
            <p className="font-sans text-[13px] text-muted-foreground">This account signs in with {user?.app_metadata?.provider ?? "a connected provider"}. Manage its password there.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="CURRENT PASSWORD"><input className={inputClass} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></Field>
              <Field label="NEW PASSWORD"><input className={inputClass} type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></Field>
              <Field label="CONFIRM NEW PASSWORD"><input className={inputClass} type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></Field>
              <div className="sm:col-span-3"><RetroButton variant="ok" onClick={changePassword} disabled={busy || !currentPassword || !newPassword || !confirmPassword}>UPDATE PASSWORD</RetroButton></div>
            </div>
          )}
        </Panel>

      </div>
    </Shell>
  );
}
