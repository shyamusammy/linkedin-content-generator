## Problem

The app is running on `f14199a3-bc89-499c-a804-135496fbd4ec.lovableproject.com` (the sandbox dev preview). The callback URL logic in `src/routes/index.tsx` only recognizes `.lovable.app` hosts:

```ts
const callbackHost =
  host.endsWith(".lovable.app") && !host.startsWith("id-preview--")
    ? `https://${host}`
    : `https://project--${projectId}-dev.lovable.app`;
```

Since the current host ends in `.lovableproject.com`, it falls back to `https://project--f14199a3-bc89-499c-a804-135496fbd4ec-dev.lovable.app/api/public/n8n-callback`. The project isn't published and that stable URL isn't currently routable, so n8n's callback POST fails and the row stays `pending` until the 5-min timeout — which matches what we see in the network log (many polls returning `status: pending`, then a final PATCH to `failed`).

## Fix

Update the callback-host selection in `src/routes/index.tsx` to also accept `.lovableproject.com` (the sandbox dev origin is publicly reachable and `/api/public/*` bypasses auth):

```ts
const isPubliclyReachable =
  (host.endsWith(".lovable.app") && !host.startsWith("id-preview--")) ||
  host.endsWith(".lovableproject.com");

const callbackHost = isPubliclyReachable
  ? `${window.location.protocol}//${host}`
  : `https://project--${projectId}-dev.lovable.app`;
```

This keeps the existing behavior for published `.lovable.app` and custom-domain runs, avoids the auth-gated `id-preview--*` host, and uses the current sandbox origin when running from `lovableproject.com` so n8n's callback can actually reach `/api/public/n8n-callback`.

No other files change. The server route, polling loop, and DB writes are already correct.
