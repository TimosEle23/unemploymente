function requireApiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Connected accounts are not configured.");
  return key;
}

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

export async function authorizeAppUserOAuth(params: {
  connectorId: string;
  appUserId: string;
  clientAPIKey: string;
  returnUrl: string;
  connectionAPIKey?: string | undefined;
  credentialsConfiguration: Record<string, unknown>;
}) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${requireApiKey()}`,
    "Content-Type": "application/json",
    "X-Client-Api-Key": params.clientAPIKey,
  };
  if (params.connectionAPIKey) headers["X-Connection-Api-Key"] = params.connectionAPIKey;
  const response = await fetch(`${GATEWAY_BASE_URL}/api/v1/app-users/oauth2/authorize`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      connector_id: params.connectorId,
      app_user_id: params.appUserId,
      return_url: params.returnUrl,
      credentials_configuration: params.credentialsConfiguration,
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Could not start account connection (${response.status}): ${text.slice(0, 300)}`);
  const body = JSON.parse(text) as { authorization_url?: string };
  if (!body.authorization_url) throw new Error("The account connection did not return an authorization page.");
  return { authorizationUrl: body.authorization_url };
}

export async function exchangeAppUserOAuthCode(code: string) {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/v1/app-users/oauth2/exchange`, {
    method: "POST",
    headers: { Authorization: `Bearer ${requireApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Could not finish account connection (${response.status}): ${text.slice(0, 300)}`);
  const body = JSON.parse(text) as { api_key?: string; connector_id?: string };
  if (!body.api_key || !body.connector_id) throw new Error("The account connection returned incomplete information.");
  return { connectionAPIKey: body.api_key, connectorId: body.connector_id };
}

export function callAsAppUser(params: {
  connectionAPIKey: string;
  connectorId: string;
  path: string;
  requiredScopes: string[];
  init?: RequestInit;
}) {
  const headers = new Headers(params.init?.headers);
  headers.set("Authorization", `Bearer ${requireApiKey()}`);
  headers.set("X-Connection-Api-Key", params.connectionAPIKey);
  headers.set("X-Lovable-Required-Scopes", params.requiredScopes.join(" "));
  const path = params.path.startsWith("/") ? params.path : `/${params.path}`;
  return fetch(`${GATEWAY_BASE_URL}/${params.connectorId}${path}`, { ...params.init, headers });
}

export async function disconnectAppUser(connectorId: string, connectionAPIKey: string) {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/v1/app-users/connection`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${requireApiKey()}`,
      "X-Connection-Api-Key": connectionAPIKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ connector_id: connectorId }),
  });
  if (!response.ok) throw new Error(`Could not disconnect account (${response.status}).`);
}

export async function reconnectRequired(response: Response) {
  if (response.status !== 401) return false;
  const body = (await response.clone().json().catch(() => null)) as { type?: unknown } | null;
  return typeof body?.type === "string" && body.type.startsWith("credential_");
}