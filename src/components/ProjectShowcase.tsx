import { useEffect, useMemo, useRef, useState } from 'react';
import { getEmbedUrl } from '../lib/embed';
import type { ClickEffectType, EffectTriggerDetail } from './ClickEffectLayer';

export interface ShowcaseProject {
  slug: string;
  title: string;
  cover: string;
  gallery: string[];
  video?: string;
  description: string;
  techStack: string[];
  clickEffect: ClickEffectType;
}

function ModalSlideshow({ project }: { project: ShowcaseProject }) {
  const embedUrl = getEmbedUrl(project.video);
  const slides = useMemo(() => {
    const images = [project.cover, ...project.gallery].filter(
      (src, i, arr) => src && arr.indexOf(src) === i
    );
    const list: Array<{ kind: 'image' | 'video'; src: string }> = images.map((src) => ({
      kind: 'image',
      src
    }));
    if (embedUrl) list.push({ kind: 'video', src: embedUrl });
    return list;
  }, [project, embedUrl]);

  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [project]);

  useEffect(() => {
    if (slides.length < 2 || slides[index]?.kind === 'video') return undefined;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => window.clearTimeout(t);
  }, [index, slides]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-ink-900">
      {slides.map((slide, i) => (
        <div
          key={slide.src + i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? 'auto' : 'none' }}
        >
          {slide.kind === 'video' ? (
            <iframe
              className="h-full w-full"
              src={slide.src}
              title={`${project.title} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <img src={slide.src} alt={project.title} className="h-full w-full object-cover" />
          )}
        </div>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-accent' : 'w-2 bg-paper/40 hover:bg-paper/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectShowcase({ projects }: { projects: ShowcaseProject[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [activeProject, setActiveProject] = useState<ShowcaseProject | null>(null);
  const [displayedProject, setDisplayedProject] = useState<ShowcaseProject | null>(null);
  const closeTimeout = useRef<number | null>(null);

  function openProject(project: ShowcaseProject) {
    if (closeTimeout.current) window.clearTimeout(closeTimeout.current);
    setDisplayedProject(project);
    requestAnimationFrame(() => setActiveProject(project));
  }

  function closeProject() {
    setActiveProject(null);
    closeTimeout.current = window.setTimeout(() => setDisplayedProject(null), 350);
  }

  function handlePanelClick(project: ShowcaseProject, e: React.MouseEvent) {
    const detail: EffectTriggerDetail = {
      type: project.clickEffect,
      x: e.clientX,
      y: e.clientY,
      onComplete: () => openProject(project)
    };
    window.dispatchEvent(new CustomEvent('effect-trigger', { detail }));
  }

  useEffect(() => {
    if (!displayedProject) return undefined;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeProject();
    }
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [displayedProject]);

  return (
    <>
      {/* Seamless hover-accordion gallery */}
      <div className="flex h-[85vh] max-h-[820px] min-h-[520px] flex-col md:h-[78vh] md:flex-row">
        {projects.map((project, i) => {
          const isHovered = hovered === i;
          return (
            <button
              key={project.slug}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => handlePanelClick(project, e)}
              style={{ flexGrow: hovered === null ? 1 : isHovered ? 3.4 : 0.55 }}
              className="group relative min-h-[110px] flex-1 appearance-none overflow-hidden border-0 bg-transparent p-0 text-left transition-[flex-grow] duration-500 ease-out"
            >
              <img
                src={project.cover}
                alt={project.title}
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out ${
                  isHovered ? 'scale-110' : 'scale-100'
                }`}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t from-ink-950 transition-opacity duration-500 ${
                  isHovered ? 'from-ink-950/90 via-ink-950/20 opacity-100' : 'via-transparent opacity-90'
                } to-transparent`}
              />

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <h3 className="font-display text-lg font-bold text-paper drop-shadow sm:text-xl">
                  {project.title}
                </h3>
                <p
                  className={`mt-2 max-w-sm overflow-hidden text-sm text-paper-dim transition-all duration-300 ${
                    isHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {project.description}
                </p>
                <div
                  className={`mt-3 flex flex-wrap gap-2 transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-ink-950/70 px-3 py-1 text-xs font-semibold text-accent-2"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-accent to-accent-2 transition-transform duration-500 ${
                  isHovered ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Fade-in project modal */}
      <div
        onClick={closeProject}
        aria-hidden="true"
        className={`fixed inset-0 z-[150] bg-ink-950/95 backdrop-blur transition-opacity duration-[350ms] ${
          activeProject ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {displayedProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={displayedProject.title}
          className={`fixed inset-0 z-[160] flex items-center justify-center overflow-y-auto p-4 transition-all duration-[350ms] sm:p-8 ${
            activeProject ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
          }`}
        >
          <button
            onClick={closeProject}
            className="fixed right-5 top-5 z-10 flex items-center gap-2 rounded-full bg-ink-900/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper transition-colors hover:bg-ink-800 hover:text-accent-2"
          >
            Close <span aria-hidden="true">✕</span>
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="grid w-full max-w-5xl gap-8 py-10 md:grid-cols-2 md:items-center md:py-0"
          >
            <ModalSlideshow project={displayedProject} />

            <div>
              <h2 className="font-display text-3xl font-extrabold text-paper sm:text-4xl">
                {displayedProject.title}
              </h2>
              <p className="mt-4 text-paper-dim">{displayedProject.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {displayedProject.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-accent-2"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <a
                href={`/projects/${displayedProject.slug}`}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-accent-2"
              >
                View Full Case Study →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
