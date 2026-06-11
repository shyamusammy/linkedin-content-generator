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
import { type GeneratedContent } from "@/lib/n8n";
import { supabase } from "@/integrations/supabase/client";
import { getPostStatus, markPostFailed } from "@/lib/posts.functions";
import { triggerN8nGeneration } from "@/lib/n8n.functions";
import { useServerFn } from "@tanstack/react-start";
import homepageHero from "@/assets/workspace-bg.png.asset.json";

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
  const trigger = useServerFn(triggerN8nGeneration);
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
      // The callback URL is constructed server-side inside triggerN8nGeneration
      // to prevent SSRF: a client-controlled callbackUrl would let attackers
      // make n8n POST generated content to arbitrary hosts.
      const trig = await trigger({
        data: {
          id: pending.id,
          email: parsed.data.email,
          topic: parsed.data.topic,
          audience: parsed.data.audience,
          tone: parsed.data.tone,
          postType: parsed.data.postType,
        },
      });

      if (!trig.ok) {
        setErrorInfo({
          message: `Webhook returned HTTP ${trig.status ?? 0}`,
          status: trig.status,
          rawBody: trig.body,
        });
        await markPostFailed({ data: { id: pending.id } });
        toast.error(`Webhook error ${trig.status ?? ""}`);
        setLoading(false);
        return;
      }


      // Poll the posts row until the callback marks it completed/failed.
      // Max ~5 minutes (100 attempts × 3s).
      const started = Date.now();
      const MAX_MS = 5 * 60 * 1000;
      const INTERVAL_MS = 3000;

      while (Date.now() - started < MAX_MS) {
        await new Promise((r) => setTimeout(r, INTERVAL_MS));

        let row: Awaited<ReturnType<typeof getPostStatus>>["row"] = null;
        let pollErr: unknown = null;
        try {
          const res = await getPostStatus({ data: { id: pending.id } });
          row = res.row;
        } catch (err) {
          pollErr = err;
        }

        if (pollErr) {
          console.error(pollErr);
          continue;
        }
        if (!row) continue;

        if (row.status === "completed" && row.linkedin_post) {
          setResult({
            title: row.title ?? parsed.data.topic,
            linkedinPost: row.linkedin_post,
            imagePrompt: row.image_prompt ?? "",
            hashtags: row.hashtags ?? [],
            cta: row.cta ?? "",
          });
          toast.success("Content generated");
          setLoading(false);
          return;
        }

        if (row.status === "failed") {
          setErrorInfo({
            message:
              "n8n reported a failure for this job. Check the workflow execution log.",
          });
          toast.error("Generation failed");
          setLoading(false);
          return;
        }
      }

      // Timed out waiting for the callback
      setErrorInfo({
        message:
          "Timed out waiting for n8n to call back (5 min). Verify the Respond to Webhook node is set to 'Immediately' and that the workflow POSTs results to the callback URL.",
      });
      await markPostFailed({ data: { id: pending.id } });
      toast.error("Timed out");
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorInfo({
        message: err instanceof Error ? err.message : "Network request failed",
      });
      await markPostFailed({ data: { id: pending.id } });
      toast.error("Generation failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${homepageHero.url})` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-white/40" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col justify-center p-4 md:p-8 space-y-6">


      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Generate</h1>
        <p className="text-sm text-muted-foreground">
          Describe what you want, and we'll draft a LinkedIn-ready post.
        </p>
      </header>

      <Card className="rounded-2xl bg-white shadow-xl">

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

      {errorInfo && !loading && (
        <Card className="rounded-2xl border-destructive/40 bg-destructive/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Generation failed
            </CardTitle>
            <CardDescription className="text-destructive/80">
              {errorInfo.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {typeof errorInfo.status === "number" && (
              <div>
                <span className="font-medium">HTTP status:</span> {errorInfo.status}
              </div>
            )}
            {errorInfo.missing && errorInfo.missing.length > 0 && (
              <div>
                <span className="font-medium">Missing fields:</span>{" "}
                {errorInfo.missing.join(", ")}
              </div>
            )}
            {errorInfo.rawBody !== undefined && (
              <div>
                <div className="mb-1 font-medium">Raw webhook response:</div>
                <pre className="max-h-80 overflow-auto rounded-lg border bg-background p-3 text-xs">
                  {errorInfo.rawBody || "(empty)"}
                </pre>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Fix the "Respond to Webhook" node in n8n so it returns a JSON
              object (or array) with fields: title, linkedin_post, image_prompt,
              hashtags, cta.
            </p>
          </CardContent>
        </Card>
      )}

      {result && <ResultsView content={result} />}
      </div>
    </>
  );
}
