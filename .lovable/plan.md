## Goal
Create a full-screen background for the homepage that uses the colors/visual style of the uploaded screenshot, while leaving all existing UI elements (sidebar, header, form card) exactly where they are.

## Steps

1. **Generate background image**
   - Use `imagegen--generate_image` to create an abstract background (1920×1080) inspired by the uploaded screenshot's palette: clean white/light gray base with subtle blue accent tones matching the LinkedIn AI Content Generator UI.
   - Save to `src/assets/homepage-bg.jpg`.

2. **Upload to Lovable Assets CDN**
   - Run `lovable-assets create` on the generated file → `src/assets/homepage-bg.jpg.asset.json`.
   - Remove the local binary.

3. **Apply in `src/routes/index.tsx`**
   - Replace the current `homepage-hero` background reference with the new `homepage-bg` asset.
   - Keep the existing fixed full-viewport pattern (`fixed inset-0 -z-10 bg-cover bg-center`) and overlay.
   - Tune the overlay opacity if needed so the light background doesn't wash out form readability.

4. **Verify**
   - Check the preview to confirm the background covers the full screen and the form/sidebar remain readable and unchanged.

## Files touched
- `src/assets/homepage-bg.jpg.asset.json` (new)
- `src/routes/index.tsx` (swap background image URL)
- Old `src/assets/homepage-hero.png.asset.json` left in place unless you want it deleted.