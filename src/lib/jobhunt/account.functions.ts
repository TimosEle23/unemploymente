import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const USER_TABLES = [
  "application_events",
  "notes",
  "skills",
  "contacts",
  "followups",
  "screenshots",
  "email_import_drafts",
  "applications",
] as const;

// Export everything the signed-in user owns. Uses the user's own session, so RLS
// guarantees only their rows are returned; the explicit user_id filter is a second guard.
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (profileError) throw new Error("Could not read your profile.");
    const tables: Record<string, unknown[]> = {};
    for (const table of USER_TABLES) {
      const { data, error } = await supabase.from(table).select("*").eq("user_id", userId);
      if (error) throw new Error(`Could not export ${table}.`);
      tables[table] = data ?? [];
    }
    const { getConnectionStates } = await import("@/server/appUserConnections.server");
    const connections = await getConnectionStates(userId);
    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      email: (context.claims as { email?: string } | undefined)?.email ?? null,
      profile,
      ...tables,
      connected_inboxes: connections, // provider + status only, never credentials
    };
  });

async function listAllFiles(
  storage: { from: (bucket: string) => { list: (path: string, opts?: { limit?: number }) => Promise<{ data: { name: string; id: string | null }[] | null }> } },
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const { data } = await storage.from(bucket).list(prefix, { limit: 1000 });
  const paths: string[] = [];
  for (const item of data ?? []) {
    const full = `${prefix}/${item.name}`;
    if (item.id === null) paths.push(...(await listAllFiles(storage, bucket, full)));
    else paths.push(full);
  }
  return paths;
}

// Permanently delete the signed-in user's account and all their data.
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ confirm: z.literal("DELETE") }).parse(input))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // 1. Disconnect inboxes (server-only credentials, scoped to this user).
    const { getConnectionStates, getConnectionKey, removeConnectionKey } = await import("@/server/appUserConnections.server");
    for (const state of await getConnectionStates(userId)) {
      try {
        const key = await getConnectionKey(userId, state.connector_id);
        if (key) {
          const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector.server");
          await disconnectAppUser(state.connector_id, key);
        }
      } catch {
        // continue deleting even if the provider is unreachable
      }
      await removeConnectionKey(userId, state.connector_id);
    }

    // 2. Delete files in the user's own folders (user session, storage RLS applies).
    for (const bucket of ["screenshots", "profile-cvs"]) {
      const files = await listAllFiles(supabase.storage as never, bucket, userId);
      for (let i = 0; i < files.length; i += 100) {
        await supabase.storage.from(bucket).remove(files.slice(i, i + 100));
      }
    }

    // 3. Delete rows (user session, RLS restricts to own rows).
    for (const table of USER_TABLES) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) throw new Error(`Could not delete ${table}.`);
    }
    await supabase.from("profiles").delete().eq("id", userId);

    // 4. Remove the login itself — only this user's id, taken from the verified token.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Your data was removed, but the account could not be closed. Try again.");
    return { ok: true };
  });
