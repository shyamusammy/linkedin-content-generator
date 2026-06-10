import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const Payload = z.object({
  id: z.string().uuid(),
  title: z.string().max(500).optional().default(""),
  linkedin_post: z.string().max(20000),
  image_prompt: z.string().max(5000).optional().default(""),
  hashtags: z
    .union([z.array(z.string().max(100)).max(50), z.string().max(2000)])
    .optional()
    .default([]),
  cta: z.string().max(1000).optional().default(""),
});

function normalizeHashtags(input: unknown): string[] {
  let arr: string[] = [];
  if (Array.isArray(input)) arr = input.map((s) => String(s).trim());
  else if (typeof input === "string")
    arr = input.split(/[\s,]+/).map((s) => s.trim());
  return arr
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : `#${h}`));
}

function unwrap(val: unknown): Record<string, unknown> {
  if (Array.isArray(val) && val.length > 0) return unwrap(val[0]);
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (obj.output && typeof obj.output === "object") return unwrap(obj.output);
    if (obj.data && typeof obj.data === "object") return unwrap(obj.data);
    if (obj.json && typeof obj.json === "object") return unwrap(obj.json);
    return obj;
  }
  return {};
}

export const Route = createFileRoute("/api/public/n8n-callback")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON" }),
            { status: 400, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }

        const unwrapped = unwrap(raw);
        const parsed = Payload.safeParse(unwrapped);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({
              error: "Invalid payload",
              details: parsed.error.issues,
              received: unwrapped,
            }),
            { status: 400, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }

        const p = parsed.data;
        const hashtags = normalizeHashtags(p.hashtags);

        const { error } = await supabaseAdmin
          .from("posts")
          .update({
            title: p.title || null,
            linkedin_post: p.linkedin_post,
            image_prompt: p.image_prompt || null,
            hashtags,
            cta: p.cta || null,
            status: "completed",
          })
          .eq("id", p.id);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }

        return new Response(
          JSON.stringify({ ok: true, id: p.id }),
          { status: 200, headers: { "Content-Type": "application/json", ...CORS } },
        );
      },
    },
  },
});
