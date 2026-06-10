import { useState } from "react";
import { Copy, Check, ExternalLink, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { GeneratedContent } from "@/lib/n8n";

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
    return true;
  } catch {
    toast.error("Couldn't copy to clipboard");
    return false;
  }
}

export function ResultsView({ content }: { content: GeneratedContent }) {
  const [copiedPost, setCopiedPost] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyPost = async () => {
    const ok = await copyText(content.linkedinPost, "LinkedIn post");
    if (ok) {
      setCopiedPost(true);
      setTimeout(() => setCopiedPost(false), 1500);
    }
  };

  const handleCopyPrompt = async () => {
    const ok = await copyText(content.imagePrompt, "Image prompt");
    if (ok) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1500);
    }
  };

  const handleExternalLinkClick = (label: string) => {
    if (content.imagePrompt) {
      void copyText(content.imagePrompt, `Image prompt for ${label}`);
    }
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              Generated
            </Badge>
            <CardTitle className="text-2xl font-semibold leading-tight">
              {content.title || "Untitled post"}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              LinkedIn Post
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyPost}
              className="gap-1.5"
            >
              {copiedPost ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy Post
            </Button>
          </div>
          <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">
            {content.linkedinPost || "—"}
          </div>
        </section>

        {content.hashtags.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Hashtags
            </h3>
            <div className="flex flex-wrap gap-2">
              {content.hashtags.map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {content.cta && (
          <section>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Call to Action
            </h3>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              {content.cta}
            </div>
          </section>
        )}

        <Separator />

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              Image Prompt
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyPrompt}
              className="gap-1.5"
            >
              {copiedPrompt ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy Image Prompt
            </Button>
          </div>
          <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-sm">
            {content.imagePrompt || "—"}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              asChild
              variant="default"
              size="sm"
              className="gap-1.5"
              disabled={!content.imagePrompt}
            >
              <a
                href="https://chatgpt.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleExternalLinkClick("ChatGPT")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open ChatGPT
              </a>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="gap-1.5"
              disabled={!content.imagePrompt}
            >
              <a
                href="https://gemini.google.com/app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleExternalLinkClick("Gemini")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Gemini
              </a>
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The image prompt is copied to your clipboard before the link opens.
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
