export const N8N_WEBHOOK_URL =
  "https://shyam2795.app.n8n.cloud/webhook/generate-content";

export type GenerateInput = {
  email: string;
  topic: string;
  audience: string;
  tone: string;
  postType: string;
};

export type GeneratedContent = {
  title: string;
  linkedinPost: string;
  imagePrompt: string;
  hashtags: string[];
  cta: string;
};

/**
 * Normalize an n8n response into our GeneratedContent shape.
 * n8n responses can vary; we try common field name variants.
 */
export function normalizeN8nResponse(raw: unknown): GeneratedContent {
  // Unwrap common n8n envelopes: arrays, { data }, { output }, { json }
  let r: Record<string, unknown> = {};
  const unwrap = (val: unknown): Record<string, unknown> => {
    if (Array.isArray(val) && val.length > 0) return unwrap(val[0]);
    if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if (obj.output && typeof obj.output === "object") return unwrap(obj.output);
      if (obj.data && typeof obj.data === "object") return unwrap(obj.data);
      if (obj.json && typeof obj.json === "object") return unwrap(obj.json);
      return obj;
    }
    return {};
  };
  r = unwrap(raw);

  // Skip n8n template expressions that leaked through unrendered, e.g. "={{ ... }}"
  const isExpr = (s: string) => {
    const t = s.trim();
    return t.startsWith("={{") || t.startsWith("{{") || (t.includes("{{") && t.includes("}}"));
  };

  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = r[k];
      if (typeof v === "string" && v.trim() && !isExpr(v)) return v.trim();
    }
    return "";
  };

  const hashtagsRaw =
    (r.hashtags as unknown) ?? (r.tags as unknown) ?? (r.hashtag as unknown);
  let hashtags: string[] = [];
  if (Array.isArray(hashtagsRaw)) {
    hashtags = hashtagsRaw.map((h) => String(h).trim()).filter(Boolean);
  } else if (typeof hashtagsRaw === "string" && !isExpr(hashtagsRaw)) {
    hashtags = hashtagsRaw
      .split(/[\s,]+/)
      .map((h) => h.trim())
      .filter(Boolean);
  }
  hashtags = hashtags
    .filter((h) => h && !isExpr(h))
    .map((h) => (h.startsWith("#") ? h : `#${h}`));

  return {
    title: pick("title", "Title", "headline"),
    linkedinPost: pick(
      "linkedinPost",
      "linkedin_post",
      "post",
      "content",
      "body",
    ),
    imagePrompt: pick("imagePrompt", "image_prompt", "image"),
    hashtags,
    cta: pick("cta", "CTA", "call_to_action"),
  };
}
