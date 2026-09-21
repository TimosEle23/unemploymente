import { supabase } from "@/integrations/supabase/client";
import type {
  Application,
  ApplicationEvent,
  Followup,
  Note,
  Profile,
  Screenshot,
  Status,
} from "./types";

export async function fetchApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Application[];
}

export async function fetchApplication(id: string): Promise<Application> {
  const { data, error } = await supabase.from("applications").select("*").eq("id", id).single();
  if (error) throw error;
  return data as unknown as Application;
}

export async function fetchEvents(applicationId: string): Promise<ApplicationEvent[]> {
  const { data, error } = await supabase
    .from("application_events")
    .select("*")
    .eq("application_id", applicationId)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ApplicationEvent[];
}

export async function fetchAllEvents(): Promise<(ApplicationEvent & { application_id: string })[]> {
  const { data, error } = await supabase
    .from("application_events")
    .select("*")
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as (ApplicationEvent & { application_id: string })[];
}

export async function fetchNotes(applicationId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Note[];
}

export async function fetchFollowups(applicationId?: string): Promise<Followup[]> {
  let query = supabase.from("followups").select("*").order("due_date", { ascending: true });
  if (applicationId) query = query.eq("application_id", applicationId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Followup[];
}

export async function fetchScreenshots(applicationId: string): Promise<Screenshot[]> {
  const { data, error } = await supabase
    .from("screenshots")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Screenshot[];
}

export async function signedScreenshotUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("screenshots").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (data) return data as unknown as Profile;
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created as unknown as Profile;
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

export async function createApplication(
  userId: string,
  values: Partial<Application> & { job_title: string; company: string },
) {
  const { data, error } = await supabase
    .from("applications")
    .insert({ ...values, user_id: userId } as never)
    .select("*")
    .single();
  if (error) throw error;
  const app = data as unknown as Application;

  const rows = [
    ...app.required_skills.map((name) => ({ name, kind: "REQUIRED" })),
    ...app.preferred_skills.map((name) => ({ name, kind: "PREFERRED" })),
  ];
  if (rows.length) {
    await supabase
      .from("skills")
      .insert(rows.map((row) => ({ ...row, application_id: app.id, user_id: userId })) as never);
  }
  await addEvent(userId, app.id, {
    event_type: app.status === "APPLIED" ? "APPLICATION SUBMITTED" : "JOB SAVED",
    event_date: new Date().toISOString().slice(0, 10),
    notes: null,
  });
  return app;
}

export async function updateApplication(id: string, patch: Partial<Application>) {
  const { error } = await supabase.from("applications").update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function deleteApplication(id: string) {
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteSeedApplications() {
  const { error } = await supabase.from("applications").delete().eq("is_seed", true);
  if (error) throw error;
}

export async function setStatus(userId: string, app: Application, status: Status) {
  const patch: Partial<Application> = { status };
  if (status === "APPLIED" && !app.applied_at) patch.applied_at = new Date().toISOString().slice(0, 10);
  await updateApplication(app.id, patch);
  await addEvent(userId, app.id, {
    event_type:
      status === "APPLIED"
        ? "APPLICATION SUBMITTED"
        : status === "REJECTED"
          ? "REJECTED"
          : status === "OFFER"
            ? "OFFER RECEIVED"
            : status.replace(/_/g, " "),
    event_date: new Date().toISOString().slice(0, 10),
    notes: null,
  });
}

export async function addEvent(
  userId: string,
  applicationId: string,
  event: { event_type: string; event_date: string; notes: string | null },
) {
  const { error } = await supabase
    .from("application_events")
    .insert({ ...event, application_id: applicationId, user_id: userId } as never);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("application_events").delete().eq("id", id);
  if (error) throw error;
}

export async function addNote(
  userId: string,
  applicationId: string,
  note: { category: string; content: string },
) {
  const { error } = await supabase
    .from("notes")
    .insert({ ...note, application_id: applicationId, user_id: userId } as never);
  if (error) throw error;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

export async function addFollowup(
  userId: string,
  applicationId: string,
  followup: { action: string; due_date: string | null; notes: string | null },
) {
  const { error } = await supabase
    .from("followups")
    .insert({ ...followup, application_id: applicationId, user_id: userId } as never);
  if (error) throw error;
}

export async function toggleFollowup(id: string, done: boolean) {
  const { error } = await supabase.from("followups").update({ done }).eq("id", id);
  if (error) throw error;
}

export async function uploadScreenshots(
  userId: string,
  applicationId: string,
  files: File[],
): Promise<void> {
  for (const file of files) {
    const path = `${userId}/${applicationId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("screenshots").upload(path, file, {
      contentType: file.type || "image/png",
      upsert: false,
    });
    if (error) throw error;
    const { error: rowError } = await supabase.from("screenshots").insert({
      user_id: userId,
      application_id: applicationId,
      storage_path: path,
      file_name: file.name,
    } as never);
    if (rowError) throw rowError;
  }
}

export function findDuplicates(
  applications: Application[],
  candidate: { job_title: string | null; company: string | null; job_url: string | null },
): Application[] {
  const title = (candidate.job_title ?? "").trim().toLowerCase();
  const company = (candidate.company ?? "").trim().toLowerCase();
  const url = (candidate.job_url ?? "").trim().toLowerCase();
  return applications.filter((app) => {
    const sameUrl = !!url && (app.job_url ?? "").trim().toLowerCase() === url;
    const sameCompany = !!company && app.company.trim().toLowerCase() === company;
    const sameTitle = !!title && app.job_title.trim().toLowerCase() === title;
    return sameUrl || (sameCompany && sameTitle);
  });
}
