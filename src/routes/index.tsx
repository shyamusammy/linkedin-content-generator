import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResultsView } from "@/components/ResultsView";
import {
  N8N_WEBHOOK_URL,
  normalizeN8nResponse,
  type GeneratedContent,
} from "@/lib/n8n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Generate — LinkedIn AI Content Generator" },
      {
        name: "description",
        content:
          "Generate LinkedIn-ready posts with AI: pick a topic, audience, and tone, and get a polished post in seconds.",
      },
    ],
  }),
  component: GeneratePage,
});

const TONES = [
  "Professional",
  "Casual",
  "Thought Leadership",
  "Inspirational",
  "Educational",
];

const POST_TYPES = [
  "Thought Leadership",
  "Educational",
  "Personal Story",
  "Case Study",
  "Contrarian Take",
  "Industry Insight",
];

const FormSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  topic: z.string().trim().min(2, "Topic is required").max(500),
  audience: z.string().trim().min(2, "Audience is required").max(255),
  tone: z.string().min(1, "Select a tone"),
  postType: z.string().min(1, "Select a post type"),
});

function GeneratePage() {
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [postType, setPostType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    status?: number;
    rawBody?: string;
    missing?: string[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = FormSchema.safeParse({ email, topic, audience, tone, postType });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setLoading(true);
    setResult(null);
    setErrorInfo(null);

    // Create pending row
    const { data: pending, error: insertError } = await supabase
      .from("posts")
      .insert({
        email: parsed.data.email,
        topic: parsed.data.topic,
        audience: parsed.data.audience,
        tone: parsed.data.tone,
        post_type: parsed.data.postType,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(insertError);
      toast.error("Couldn't save your request");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.data.email,
          topic: parsed.data.topic,
          audience: parsed.data.audience,
          tone: parsed.data.tone,
          postType: parsed.data.postType,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        setErrorInfo({
          message: `Webhook returned HTTP ${res.status}`,
          status: res.status,
          rawBody: text,
        });
        await supabase.from("posts").update({ status: "failed" }).eq("id", pending.id);
        toast.error(`Webhook error ${res.status}`);
        return;
      }

      if (!text || !text.trim()) {
        setErrorInfo({
          message: "The webhook responded with an empty body. Check the 'Respond to Webhook' node in n8n.",
          status: res.status,
          rawBody: "(empty)",
        });
        await supabase.from("posts").update({ status: "failed" }).eq("id", pending.id);
        toast.error("Empty response from webhook");
        return;
      }

      let raw: unknown = {};
      let parseFailed = false;
      try {
        raw = JSON.parse(text);
      } catch {
        parseFailed = true;
        raw = { linkedinPost: text };
      }

      const content = normalizeN8nResponse(raw);
      const missing: string[] = [];
      if (!content.title) missing.push("title");
      if (!content.linkedinPost) missing.push("linkedin_post");
      if (!content.imagePrompt) missing.push("image_prompt");
      if (content.hashtags.length === 0) missing.push("hashtags");
      if (!content.cta) missing.push("cta");

      // Hard fail if the essential post body is missing
      if (!content.linkedinPost) {
        setErrorInfo({
          message: parseFailed
            ? "Webhook response wasn't valid JSON."
            : "Webhook response is missing required fields. The n8n workflow may be returning unevaluated expressions or the wrong shape.",
          status: res.status,
          rawBody: text,
          missing,
        });
        await supabase.from("posts").update({ status: "failed" }).eq("id", pending.id);
        toast.error("Incomplete content received");
        return;
      }

      await supabase
        .from("posts")
        .update({
          title: content.title || parsed.data.topic,
          linkedin_post: content.linkedinPost,
          image_prompt: content.imagePrompt,
          hashtags: content.hashtags,
          cta: content.cta,
          status: "completed",
        })
        .eq("id", pending.id);

      setResult(content);
      if (missing.length > 0) {
        toast.success(`Generated (missing: ${missing.join(", ")})`);
      } else {
        toast.success("Content generated");
      }
    } catch (err) {
      console.error(err);
      setErrorInfo({
        message: err instanceof Error ? err.message : "Network request failed",
      });
      await supabase
        .from("posts")
        .update({ status: "failed" })
        .eq("id", pending.id);
      toast.error("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Generate</h1>
        <p className="text-sm text-muted-foreground">
          Describe what you want, and we'll draft a LinkedIn-ready post.
        </p>
      </header>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">New post</CardTitle>
          <CardDescription>
            All fields are required. We'll save this to your history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="audience">Audience</Label>
              <Input
                id="audience"
                placeholder="e.g. Startup founders"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="What is the post about?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Post Type</Label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a post type" />
                </SelectTrigger>
                <SelectContent>
                  {POST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full gap-2 md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calling the AI workflow… this can take 20–60 seconds.
          </CardContent>
        </Card>
      )}

      {result && <ResultsView content={result} />}
    </div>
  );
}
