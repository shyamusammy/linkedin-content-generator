import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";

const Input = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(255),
  topic: z.string().min(2).max(500),
  audience: z.string().min(2).max(255),
  tone: z.string().min(1).max(100),
  postType: z.string().min(1).max(100),
});

const PROJECT_ID = "f14199a3-bc89-499c-a804-135496fbd4ec";

export const triggerN8nGeneration = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const webhookUrl =
      process.env.N8N_WEBHOOK_URL ??
      "https://shyam2795.app.n8n.cloud/webhook/generate-content";

    // Construct callback URL server-side. Prefer explicit env override; else
    // derive from the request host when it's a publicly reachable .lovable.app
    // host; else fall back to the stable project preview host.
    let callbackBase = process.env.N8N_CALLBACK_BASE_URL;
    if (!callbackBase) {
      let host: string | undefined;
      try {
        host = getRequestHost();
      } catch {
        host = undefined;
      }
      const reachable =
        host &&
        host.endsWith(".lovable.app") &&
        !host.startsWith("id-preview--");
      callbackBase = reachable
        ? `https://${host}`
        : `https://project--${PROJECT_ID}-dev.lovable.app`;
    }
    const callbackUrl = `${callbackBase.replace(/\/$/, "")}/api/public/n8n-callback`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.N8N_CALLBACK_SECRET) {
      headers["x-n8n-secret"] = process.env.N8N_CALLBACK_SECRET;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id: data.id,
          callbackUrl,
          email: data.email,
          topic: data.topic,
          audience: data.audience,
          tone: data.tone,
          postType: data.postType,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false as const, status: res.status, body };
      }
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        status: 0,
        body: err instanceof Error ? err.message : "Network error",
      };
    }
  });
