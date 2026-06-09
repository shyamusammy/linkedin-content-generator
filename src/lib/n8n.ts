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
  const r =
    Array.isArray(raw) && raw.length > 0
      ? (raw[0] as Record<string, unknown>)
      : ((raw as Record<string, unknown>) ?? {});

  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = r[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };

  const hashtagsRaw =
    (r.hashtags as unknown) ?? (r.tags as unknown) ?? (r.hashtag as unknown);
  let hashtags: string[] = [];
  if (Array.isArray(hashtagsRaw)) {
    hashtags = hashtagsRaw.map((h) => String(h).trim()).filter(Boolean);
  } else if (typeof hashtagsRaw === "string") {
    hashtags = hashtagsRaw
      .split(/[\s,]+/)
      .map((h) => h.trim())
      .filter(Boolean);
  }
  hashtags = hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`));

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
