# 3D Artist Portfolio

A portfolio + CV site for a 3D artist (characters, worlds, tools, FX). Built with Astro + React +
Tailwind CSS, content managed through a Decap CMS admin dashboard at `/admin`.

## Stack

- **Astro** — static site generation, routing, markdown rendering (Shiki syntax highlighting built in)
- **React** — interactive islands (project showcase/modal, hero slideshow, history sidebar, click effects)
- **Tailwind CSS v4** — cinematic dark theme with a warm coral/amber/violet accent palette
  (`src/styles/global.css`)
- **`<model-viewer>`** — optional interactive 3D preview (`.glb`/`.gltf`) on project detail pages
- **Interaction layer** — a seamless hover-accordion project gallery, a fade-in project modal with
  its own slideshow, 10 particle click-transition effects, a timed hero background slideshow, scroll
  parallax, and a slide-in Career Timeline sidebar (see below)
- **Decap CMS** — visual admin dashboard for editing content without touching code
- **Netlify** — hosting + Decap CMS git-gateway auth + form handling

## Project structure

```text
/
├── public/
│   ├── admin/            # Decap CMS (index.html + config.yml)
│   ├── cv/               # resume.pdf lives here (uploaded via CMS)
│   ├── uploads/          # project cover + gallery images (uploaded via CMS)
│   ├── hero/             # hero slideshow images/videos (uploaded via CMS)
│   ├── videos/           # legacy hero reel video + poster
│   └── models/           # .glb/.gltf files for the 3D project preview (uploaded via CMS)
├── src/
│   ├── components/
│   │   ├── Hero.astro / HeroSlideshow.tsx     # timed fade hero background
│   │   ├── ProjectGallery.astro               # fetches + sorts project data
│   │   ├── ProjectShowcase.tsx                # hover-accordion gallery + fade modal + slideshow
│   │   ├── ClickEffectLayer.tsx               # the 10-effect particle transition system
│   │   ├── HistorySidebar.tsx                 # slide-in career timeline w/ sticky year marker
│   │   ├── Skills.astro, Contact.astro
│   ├── content/
│   │   ├── projects/     # one markdown file per project (edited via CMS)
│   │   └── history/      # one markdown file per career timeline entry (edited via CMS)
│   ├── content.config.ts # Astro content collection schemas for "projects" and "history"
│   ├── data/
│   │   └── resume.json   # name, tagline, CV link, socials, skills, hero slides (edited via CMS)
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       ├── index.astro
│       └── projects/[slug].astro   # full case-study page (deep-linkable, SEO)
└── netlify.toml
```

## Local development

```sh
npm install
npm run dev
```

Site runs at `http://localhost:4321`.

### Editing content locally through the CMS

Decap CMS talks to Netlify's git-gateway in production, but locally you can point it at your
filesystem instead:

```sh
npx decap-server      # in one terminal
npm run dev           # in another terminal
```

Then open `http://localhost:4321/admin/` — `local_backend: true` in `public/admin/config.yml`
routes CMS writes straight to your working copy, so you can see edits land as real file changes.

## Content model

- **Projects** (`Projects` collection in the CMS) — one markdown file per project in
  `src/content/projects/`. Fields: Title, Slug, Cover Image, Gallery (extra images for the modal
  slideshow), Video Link (YouTube/Vimeo URL, optional), 3D Model (`.glb`/`.gltf`, optional —
  renders as an interactive `<model-viewer>` on the full case-study page), Click Effect (one of 10
  particle effects — see below), Tech Stack, Short Description, Order, and a markdown Body for the
  full case-study write-up.
- **History** (`History` collection in the CMS) — one markdown file per career-timeline entry.
  Fields: Date (`YYYY` or `YYYY-MM` — controls sort order), Title, Description, and Tag (controls
  the timeline marker color). Rendered oldest-to-newest in the slide-in History sidebar.
- **Resume / Skills** (`settings` files collection) — a single file, `src/data/resume.json`: name,
  headline, tagline, contact email, GitHub/ArtStation links, CV PDF, the categorized skills list,
  and **Hero Slideshow** — a list of image/video slides with a duration each, faded between on the
  homepage background.

Adding a project, a career milestone, or a hero slide is all done through `/admin` — no code changes
required.

## Interaction layer

- **Project showcase** (`ProjectShowcase.tsx`) — a seamless, borderless row of full-bleed project
  panels (no gaps, no gallery-card chrome). Hovering a panel grows it and shrinks its neighbors
  (animated `flex-grow`); clicking one plays its Click Effect, then fades into a full-screen modal
  with its own image/video slideshow, description, and a "View Full Case Study" link to the real
  `/projects/[slug]` page. Closing (✕ button, backdrop click, or Escape) fades back to the gallery.
- **Click Effects** (`ClickEffectLayer.tsx`) — 10 particle-based transition effects: `leaf`, `smoke`,
  `converge`, `slash`, `skull`, `glass`, `explosion`, `bubble`, `wind`, `sparkle`. Everything is
  driven by a single `effect-trigger` window `CustomEvent` (`{ type, x, y, onComplete }`), so wiring
  up an 11th effect means: add a keyframe + class in `global.css`, a `buildX()` particle-list
  function in `ClickEffectLayer.tsx`, and a case in `buildParticles()`. Respects
  `prefers-reduced-motion` (skips straight to `onComplete`).
- **Hero slideshow** (`HeroSlideshow.tsx`) — cross-fades between the configured hero slides on a
  per-slide timer; supports both images and looping muted video.
- **Parallax** — the header/hero composition drifts at a different rate than page scroll.
- **History sidebar** (`HistorySidebar.tsx`) — clicking "History" in the nav opens a slide-in panel;
  a large year marker stays pinned at the top and updates (via `IntersectionObserver`) as you scroll
  through entries. Closes on outside click or Escape.

### A note on the "stuck page" bug

An earlier version dispatched the click effect and then called `window.location.href` after a
timeout to navigate to the project page. If a visitor hit the browser Back button while (or after)
that fired, the page could be restored from the back-forward cache with the full-screen effect
overlay still mounted mid-animation — invisible, but sitting on top of everything with
`pointer-events: auto`, silently swallowing every click until a hard refresh. Fixed by (1) making
the overlay `pointer-events-none` unconditionally, and (2) the gallery no longer navigates at all on
click — it opens an in-page modal instead, so there's no navigation/bfcache interaction left to break.

## Deploying to Netlify (and activating the CMS)

1. **Push to GitHub.**

   ```sh
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create a Netlify site from the repo.** In the Netlify dashboard: *Add new site → Import an
   existing project* → pick the GitHub repo. Build settings (Netlify auto-detects these from
   `netlify.toml`, but confirm):
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Enable Netlify Identity.** Site configuration → Identity → *Enable Identity*.
   - Under **Registration**, set to *Invite only* (recommended) so random visitors can't sign up
     as CMS editors.
   - Under **Services → Git Gateway**, click *Enable Git Gateway*. This is what lets Decap CMS
     commit content changes to your repo on your behalf, without each editor needing their own
     GitHub account/token.

4. **Invite yourself as a CMS user.** Identity tab → *Invite users* → enter your email → accept
   the invite email → set a password.

5. **Open the dashboard.** Visit `https://<your-site>.netlify.app/admin/`, log in with Netlify
   Identity, and you'll get the full visual editor for Projects, History, and Resume/Skills.

6. **Forms.** The contact form (`src/components/Contact.astro`) is a plain static form with
   `data-netlify="true"`, so Netlify detects and wires it up automatically at build/deploy time —
   submissions show up under *Forms* in the Netlify dashboard. No extra config needed.

## Replacing placeholder assets

- `public/cv/resume.pdf` — placeholder PDF, replace via the CMS (Resume/Skills → CV / Resume PDF)
  or by overwriting the file directly.
- `public/uploads/*.svg` — placeholder project thumbnails/gallery images; upload real cover
  images/GIFs per project via the CMS.
- `public/hero/*.svg` — placeholder hero slideshow slides; replace/add slides via the CMS
  (Resume/Skills → Hero Slideshow). Mix images and short looping videos freely.
- `public/models/sample-mesh.glb` — a hand-authored single-triangle mesh, just enough to prove
  `<model-viewer>` renders and rotates correctly. Replace it with a real export via the CMS's
  "3D Model" field on any project. Keep exports small and web-optimized (`gltf-transform`/Draco
  compression) — `.glb` is a binary format so Git stores every version in full.
