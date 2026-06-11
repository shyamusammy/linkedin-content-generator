## Goal

Use the uploaded `homepage-hero.png` as a full-screen background covering the entire viewport on `/`, with the existing form content rendered on top.

## Changes

**`src/routes/index.tsx`**

1. Remove the current `<div>` + `<img>` hero banner block (lines 212–219).
2. Wrap the page in a fragment and add a fixed full-viewport background layer using the existing `homepageHero.url`:
   - `<div className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: \`url(${homepageHero.url})\` }} aria-hidden />`
   - Add a subtle dark overlay (`bg-background/70 backdrop-blur-sm`) so the form remains readable on top of the image.
3. Keep the form container (`max-w-5xl` etc.) unchanged so content sits above the background.

No other files are touched. Image asset pointer stays as-is.

## Notes

- Using `fixed inset-0 -z-10` ensures the image covers the entire viewport (not just the page section) and stays in place while scrolling.
- `bg-cover` + `bg-center` makes the image fill the area without distortion, cropping as needed — this is the standard "cover the whole area" behavior.
