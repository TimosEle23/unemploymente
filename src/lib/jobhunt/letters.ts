import type { UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";

export type LetterThread = {
  id: string;
  title: string;
  application_id: string | null;
  job_text: string | null;
  updated_at: string;
};

export async function fetchLetterThreads(): Promise<LetterThread[]> {
  const { data, error } = await supabase
    .from("letter_threads")
    .select("id,title,application_id,job_text,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LetterThread[];
}

export async function fetchLetterThread(id: string): Promise<LetterThread | null> {
  const { data, error } = await supabase
    .from("letter_threads")
    .select("id,title,application_id,job_text,updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as LetterThread | null;
}

export async function fetchLetterMessages(threadId: string): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("letter_messages")
    .select("message_id,role,parts")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.message_id,
    role: row.role as "user" | "assistant",
    parts: row.parts as UIMessage["parts"],
  }));
}

export async function createLetterThread(
  userId: string,
  values: { application_id?: string | null; job_text?: string | null; title?: string },
) {
  const { data, error } = await supabase
    .from("letter_threads")
    .insert({ user_id: userId, ...values })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateLetterThread(id: string, patch: { application_id?: string | null; job_text?: string | null }) {
  const { error } = await supabase.from("letter_threads").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteLetterThread(id: string) {
  const { error } = await supabase.from("letter_threads").delete().eq("id", id);
  if (error) throw error;
}
