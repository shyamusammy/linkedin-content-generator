import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { History as HistoryIcon, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResultsView } from "@/components/ResultsView";
import { listPostsByEmail } from "@/lib/posts.functions";
import type { GeneratedContent } from "@/lib/n8n";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — LinkedIn AI Content Generator" },
      {
        name: "description",
        content: "Browse your previously generated LinkedIn posts.",
      },
    ],
  }),
  component: HistoryPage,
});

type PostRow = {
  id: string;
  email?: string;
  topic: string;
  title: string | null;
  linkedin_post: string | null;
  image_prompt: string | null;
  hashtags: string[] | null;
  cta: string | null;
  status: string;
  created_at: string;
};

const EMAIL_KEY = "linkedin-ai:email";

function statusVariant(status: string) {
  switch (status) {
    case "completed":
      return "default" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function HistoryPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PostRow | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setSubmittedEmail(saved);
    }
  }, []);

  useEffect(() => {
    if (!submittedEmail) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("posts")
      .select(
        "id, email, topic, title, linkedin_post, image_prompt, hashtags, cta, status, created_at",
      )
      .eq("email", submittedEmail)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error(error);
          toast.error("Couldn't load history");
        } else {
          setRows((data ?? []) as PostRow[]);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submittedEmail]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Enter an email to load history");
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(EMAIL_KEY, trimmed);
    }
    setSubmittedEmail(trimmed);
  };

  const selectedContent = useMemo<GeneratedContent | null>(() => {
    if (!selected) return null;
    return {
      title: selected.title ?? "",
      linkedinPost: selected.linkedin_post ?? "",
      imagePrompt: selected.image_prompt ?? "",
      hashtags: selected.hashtags ?? [],
      cta: selected.cta ?? "",
    };
  }, [selected]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Look up posts you've generated before.
        </p>
      </header>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Find by email</CardTitle>
          <CardDescription>
            Enter the email you used on the Generate page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="history-email">Email</Label>
              <Input
                id="history-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" className="gap-2 sm:w-auto">
              <Search className="h-4 w-4" />
              Load
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading history…
          </CardContent>
        </Card>
      ) : !submittedEmail ? null : rows.length === 0 ? (
        <Card className="rounded-2xl border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <HistoryIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No posts yet</p>
              <p className="text-sm text-muted-foreground">
                Generate your first post to see it here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <button
              key={row.id}
              onClick={() => setSelected(row)}
              className="group rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium group-hover:text-primary">
                    {row.title || row.topic}
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {row.topic}
                  </p>
                </div>
                <Badge variant={statusVariant(row.status)} className="capitalize">
                  {row.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post details</DialogTitle>
          </DialogHeader>
          {selectedContent && <ResultsView content={selectedContent} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
