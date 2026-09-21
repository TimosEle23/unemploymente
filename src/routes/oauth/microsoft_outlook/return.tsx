import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/oauth/microsoft_outlook/return")({
  head: () => ({ meta: [{ title: "Connect Outlook — JOBHUNT" }, { name: "description", content: "Finish connecting Outlook to JOBHUNT." }, { property: "og:title", content: "Connect Outlook — JOBHUNT" }, { property: "og:description", content: "Finish connecting Outlook to JOBHUNT." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: OAuthReturn,
});

function OAuthReturn() {
  const [message, setMessage] = useState("FINISHING CONNECTION…");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success") === "true";
    const code = params.get("code");
    const type = success ? "appUserConnectorOAuthComplete" : "appUserConnectorOAuthFailed";
    window.opener?.postMessage({ type, connectorId: "microsoft_outlook", code }, window.location.origin);
    setMessage(success ? "OUTLOOK CONNECTED. THIS WINDOW CAN CLOSE." : (params.get("error") ?? "CONNECTION FAILED."));
    window.close();
  }, []);
  return <main className="grid min-h-screen place-items-center bg-background p-6"><p className="pixel-text text-[10px] text-foreground">{message}</p></main>;
}