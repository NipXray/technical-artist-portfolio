# Effects guide: click effects & ambient effects

This project has two separate effect systems. Both are built the same way —
a small table of **numbers** (a "preset") that a shared renderer turns into
particles or shapes — so tuning or adding an effect almost never means
touching the rendering code, just the table.

## 1. Click effects — `src/components/ClickEffectLayer.tsx`

Triggered when a visitor clicks a project card (the `clickEffect` field on
each project, editable in `/admin`). Each effect is a `buildX()` function
that returns an array of particles (position, size, timing), and the actual
look of each particle comes from a CSS class + `@keyframes` pair in
`src/styles/global.css`.

Current presets: `leaf`, `smoke`, `converge`, `slash`, `skull`, `glass`,
`explosion`, `bubble`, `wind`, `sparkle`, plus `pulse` (the reduced-motion
fallback).

**To tune an existing one:** find its `buildX()` function in
`ClickEffectLayer.tsx` — everything is `rand(min, max)` calls for size,
count, angle, distance, duration. Change the numbers, save, refresh.

**To restyle how a particle looks** (color, blur, shape): find its CSS class
in `global.css` (e.g. `.particle-explosion-ember`) and its `@keyframes`
block. The class controls appearance (gradient, glow, blur); the keyframes
control the motion path (`transform`/`opacity` over 0% → 100%).

**To add a brand new click effect:**
1. Add the name to `ClickEffectType` at the top of `ClickEffectLayer.tsx`.
2. Write a `buildMyEffect(x, y)` function returning particles.
3. Add a case for it in `buildParticles()`.
4. Add its CSS class + keyframes in `global.css`.
5. Add the option to the `clickEffect` select list in `public/admin/config.yml`.

## 2. Ambient effects — `src/components/AmbientEffectLayer.tsx`

The continuous atmosphere that plays while a project's full-screen view is
open (the `ambientEffect` field per project). This one is more purely
declarative — look at the `PRESETS` table near the top of the file:

```ts
fog: {
  kind: 'bands',
  count: 9,
  direction: 'alternate',
  widthPct: [40, 70],
  heightPct: [7, 14],
  leftPct: [-15, 75],
  bottomPct: [-8, 4],
  duration: [26, 42],
  delay: [0, 10]
}
```

Every field is a `[min, max]` range the renderer picks a random value from
per instance — that's the whole "template." Two `kind`s exist:

- **`particles`** (smoke, embers, dust, snow, fireflies) — small drifting
  specks. Fields: `count`, `size`, `duration`, `delay`, `driftX`/`driftY`
  (how far each drifts sideways/vertically over its lifetime), and `anchor`
  (`'bottom'`/`'top'`/`'spread'` — where on screen they spawn).
- **`bands`** (fog) — wider, flatter drifting shapes for things like fog or
  smoke banks. Fields: `widthPct`/`heightPct`/`leftPct`/`bottomPct` (size and
  spawn position as a % of the frame), `direction` (`'ltr'`/`'rtl'`/`'alternate'`),
  `duration`, `delay`.

**To tune fog specifically** (e.g. make it bigger, cover more of the frame,
drift faster): edit the `fog` entry's ranges directly — no other code needs
to change.

**To add a brand new ambient preset:** add an entry to `PRESETS` with a
`kind`, then (for `particles`) a CSS class + `@keyframes` pair following the
`.ambient-smoke` pattern in `global.css`, or (for `bands`) follow the
`.ambient-fog-band` pattern. Add the option to the `ambientEffect` select
list in `public/admin/config.yml` and to `AMBIENT_EFFECTS` in
`src/content.config.ts`.

**Using your own texture/video instead of the CSS version:** every project
has an "Ambient Custom Video" upload field in `/admin`. Upload a looping
video there (a real smoke/fog/fire clip, or a rendered VFX pass) and it
replaces the CSS effect entirely for that project — no code changes needed.
This is the easiest way to get a genuinely custom look without touching
`AmbientEffectLayer.tsx` at all.

## Where to learn more about making your own textures

Since the current fog/smoke are procedurally generated (an SVG noise
filter, not a texture image), swapping in a real hand-made or rendered
texture will look noticeably better. A few practical starting points:

- **Free texture/sprite sources**: [Poly Haven](https://polyhaven.com) and
  [ambientCG](https://ambientcg.com) for free PBR/photo textures;
  [itch.io](https://itch.io/game-assets/tag-vfx) and OpenGameArt for free
  hand-painted VFX sprite sheets (smoke, fire, fog) made specifically for
  game/motion use.
- **Making your own in a paint tool**: Photoshop's Cloud Filter / Render >
  Difference Clouds (repeated + layered) is the classic quick way to hand-
  paint a believable smoke/fog texture; a soft round brush with low
  opacity + smudge is the traditional VFX-texture painting technique.
- **Procedural/node-based**: since a lot of your own project work is
  Houdini — the curl-noise / fractal-noise approach you already used for
  Storm Wisp is exactly the same technique behind the current fog filter,
  just rendered out as a real texture/flipbook instead of computed live in
  the browser. Rendering a short looping smoke sim out of Houdini (or
  Substance Designer's noise nodes) as a `.webm`/`.mp4` and dropping it into
  the "Ambient Custom Video" field would probably be the highest-quality,
  lowest-effort upgrade path given your existing toolset.
- **Video/VFX-artist-focused tutorials**: YouTube channels like
  *Gabriel Aguiar Prod.* and *Game FX / VFX Apprentice* cover exactly this
  kind of stylized smoke/fog/particle texture creation for real-time use.
