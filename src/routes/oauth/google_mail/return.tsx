import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/oauth/google_mail/return")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Connect Gmail — Unemploymente" }, { name: "description", content: "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage." }, { property: "og:title", content: "Connect Gmail — Unemploymente" }, { property: "og:description", content: "Track every job application in one place. Position, company, status, deadline, required skills and interview progress, plus analytics on the skills you lack. Add jobs from a screenshot or your Gmail inbox, then track position, company, status, deadline, skills needed and every interview stage." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: OAuthReturn,
});

function OAuthReturn() {
  const [message, setMessage] = useState("FINISHING CONNECTION…");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success") === "true";
    const code = params.get("code");
    const type = success ? "appUserConnectorOAuthComplete" : "appUserConnectorOAuthFailed";
    window.opener?.postMessage({ type, connectorId: "google_mail", code }, window.location.origin);
    setMessage(success ? "GMAIL CONNECTED. THIS WINDOW CAN CLOSE." : (params.get("error") ?? "CONNECTION FAILED."));
    window.close();
  }, []);
  return <main className="grid min-h-screen place-items-center bg-background p-6"><p className="pixel-text text-[10px] text-foreground">{message}</p></main>;
}