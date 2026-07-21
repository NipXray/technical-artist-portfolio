# Technical Artist Portfolio

A portfolio + CV site for a technical artist (rigging, tool dev, shaders, pipeline). Built with
Astro + React + Tailwind CSS, content managed through a Decap CMS admin dashboard at `/admin`.

## Stack

- **Astro** — static site generation, routing, markdown rendering (Shiki syntax highlighting built in)
- **React** — interactive islands (the project card)
- **Tailwind CSS v4** — dark, IDE-style theme (`src/styles/global.css`)
- **`<model-viewer>`** — optional interactive 3D preview (`.glb`/`.gltf`) on project detail pages
- **Interaction layer** — hover tilt/glow on project cards, a per-project click "transition" effect
  (leaf/smoke/converge particles) before navigating, scroll parallax on the hero grid, and a
  slide-in Career Timeline sidebar (see below)
- **Decap CMS** — visual admin dashboard for editing content without touching code
- **Netlify** — hosting + Decap CMS git-gateway auth + form handling

## Project structure

```text
/
├── public/
│   ├── admin/            # Decap CMS (index.html + config.yml)
│   ├── cv/               # resume.pdf lives here (uploaded via CMS)
│   ├── uploads/          # project cover images (uploaded via CMS)
│   ├── videos/           # hero reel video + poster
│   └── models/           # .glb/.gltf files for the 3D project preview (uploaded via CMS)
├── src/
│   ├── components/       # Hero, Skills, ProjectGallery, ProjectCard (React), Contact
│   ├── content/
│   │   ├── projects/     # one markdown file per project (edited via CMS)
│   │   └── history/      # one markdown file per career timeline entry (edited via CMS)
│   ├── content.config.ts # Astro content collection schemas for "projects" and "history"
│   ├── data/
│   │   └── resume.json   # name, tagline, CV link, socials, skills (edited via CMS)
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       ├── index.astro
│       └── projects/[slug].astro
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
routes CMS writes straight to your working copy (`src/content/projects/*.md` and
`src/data/resume.json`), so you can see edits committed as real file changes.

## Content model

- **Projects** (`Projects` collection in the CMS) — one markdown file per project in
  `src/content/projects/`. Fields: Title, Slug, Cover Image, Video Link (YouTube/Vimeo URL,
  optional), 3D Model (`.glb`/`.gltf`, optional — renders as an interactive `<model-viewer>` with
  `camera-controls` so visitors can drag-to-rotate/scroll-to-zoom a rig or topology example), Click
  Effect (`none`/`leaf`/`smoke`/`converge` — the particle animation that plays when the card is
  clicked, before navigating to the project), Tech Stack, Short Description, Order (controls
  gallery position — lower first), and a markdown Body for the full technical breakdown.
- **History** (`History` collection in the CMS) — one markdown file per career-timeline entry in
  `src/content/history/`. Fields: Date (`YYYY` or `YYYY-MM` — controls sort order), Title,
  Description, and Tag (`origin`/`education`/`job`/`release`/`current` — controls the timeline
  marker color). Rendered oldest-to-newest in the slide-in "history" sidebar.
- **Resume / Skills** (`settings` files collection) — a single file, `src/data/resume.json`:
  name, headline, tagline, contact email, GitHub/ArtStation links, CV PDF, hero reel video, and the
  categorized skills list.

Adding a project, changing the CV link, adding a career milestone, or reordering the gallery is all
done through `/admin` — no code changes required.

## Interaction layer

- **Hover tilt/glow** — `ProjectCard.tsx` tracks the cursor and applies a subtle 3D tilt plus an
  accent-colored glow on hover, so cards feel reactive rather than static.
- **Click transition effects** — clicking a project card fires a `project-navigate` custom event
  (`src/components/ProjectCard.tsx`) that `ClickEffectLayer.tsx` (mounted once in `Layout.astro`)
  picks up to play a short particle animation — falling leaves, rising smoke, or converging sparks
  — before navigating to the project page. Set per-project via the Click Effect field in the CMS.
  Respects `prefers-reduced-motion` (skips straight to navigation).
- **Parallax** — the hero section's grid background drifts at a slower rate than the page scroll
  (`src/components/Hero.astro`), also skipped under `prefers-reduced-motion`.
- **History sidebar** — clicking "history" in the nav opens `HistorySidebar.tsx`, a slide-in panel
  with a backdrop; clicking outside the panel (or pressing Escape) closes it.

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
   Identity, and you'll get the full visual editor for Projects and Resume/Skills.

6. **Forms.** The contact form (`src/components/Contact.astro`) is a plain static form with
   `data-netlify="true"`, so Netlify detects and wires it up automatically at build/deploy time —
   submissions show up under *Forms* in the Netlify dashboard. No extra config needed.

## Replacing placeholder assets

- `public/cv/resume.pdf` — placeholder PDF, replace via the CMS (Resume/Skills → CV / Resume PDF)
  or by overwriting the file directly.
- `public/uploads/*.svg` — placeholder project thumbnails; upload real cover images/GIFs per
  project via the CMS.
- `public/videos/reel-placeholder.mp4` — no file is committed yet (a stray broken video reference
  is worse than none). Drop a real reel export at this path, or upload one through the CMS
  (Resume/Skills → Reel Background Video) and it'll autoplay muted/looped behind the hero section.
  If no video is present, the hero still renders correctly against the grid background.
- `public/models/sample-mesh.glb` — a hand-authored single-triangle mesh, just enough to prove
  `<model-viewer>` renders and rotates correctly. Replace it with a real export (a rig, a piece of
  topology, a prop) via the CMS's "3D Model" field on any project. Keep exports small and
  web-optimized (`gltf-transform`/Draco compression, texture-atlas where possible) — `.glb` is a
  binary format so Git will store every version in full; large meshes bloat repo size over time.
