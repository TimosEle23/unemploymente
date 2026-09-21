import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { decryptConnectionKey, encryptConnectionKey } from "./connectionKeyCrypto.server";

export async function saveConnectionKey(userId: string, connectorId: string, connectionKey: string) {
  const { error } = await supabaseAdmin.from("app_user_connections").upsert({
    user_id: userId,
    connector_id: connectorId,
    connection_key_ciphertext: encryptConnectionKey(connectionKey),
    reconnect_required: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,connector_id" });
  if (error) throw error;
}

export async function getConnectionKey(userId: string, connectorId: string) {
  const { data, error } = await supabaseAdmin
    .from("app_user_connections")
    .select("connection_key_ciphertext")
    .eq("user_id", userId)
    .eq("connector_id", connectorId)
    .maybeSingle();
  if (error) throw error;
  return data ? decryptConnectionKey(data.connection_key_ciphertext) : null;
}

export async function getConnectionStates(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("app_user_connections")
    .select("connector_id,reconnect_required")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function setReconnectRequired(userId: string, connectorId: string, required: boolean) {
  const { error } = await supabaseAdmin
    .from("app_user_connections")
    .update({ reconnect_required: required })
    .eq("user_id", userId)
    .eq("connector_id", connectorId);
  if (error) throw error;
}

export async function removeConnectionKey(userId: string, connectorId: string) {
  const { error } = await supabaseAdmin
    .from("app_user_connections")
    .delete()
    .eq("user_id", userId)
    .eq("connector_id", connectorId);
  if (error) throw error;
}