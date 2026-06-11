## Goal
Use the uploaded illustrated workspace image as a full-page decorative background on the Generate page, with a soft white overlay and a centered, elevated form card. Sidebar, header, form fields, and all backend logic stay untouched.

## Steps

1. **Upload illustration to Lovable Assets**
   - Run `lovable-assets create` on `/mnt/user-uploads/ChatGPT_Image_Jun_11_2026_09_03_00_PM.png` → `src/assets/workspace-bg.png.asset.json`.

2. **Update `src/routes/index.tsx`**
   - Swap the background import to `workspace-bg.png.asset.json`.
   - Keep the existing `fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat` layer (covers the content area; left sidebar already sits above it).
   - Change the overlay from `bg-background/30` to `bg-white/85` for a subtle 85% white wash so the form reads cleanly.
   - Wrap content in a vertically-centered container: `mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col justify-center p-4 md:p-8`.
   - Strengthen card elevation: add `bg-white shadow-xl` to the Card (keep existing `rounded-2xl` and CardContent padding).

3. **Responsive behavior**
   - `bg-cover bg-center` already scales the illustration: full view on desktop, proportional on tablet, center-prioritized on mobile.

4. **Leave untouched**
   - `AppSidebar`, root header, all form fields, n8n trigger, Supabase calls, history page, ResultsView.

## Files touched
- `src/assets/workspace-bg.png.asset.json` (new)
- `src/routes/index.tsx` (background image swap, overlay opacity, centering wrapper, card shadow)
