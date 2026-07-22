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

function ModalBackground({ project, active }: { project: ShowcaseProject; active: boolean }) {
  const images = useMemo(
    () => [project.cover, ...project.gallery].filter((src, i, arr) => src && arr.indexOf(src) === i),
    [project]
  );
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [project]);

  useEffect(() => {
    if (images.length < 2) return undefined;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % images.length), 5000);
    return () => window.clearTimeout(t);
  }, [index, images]);

  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-ink-900">
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={project.title}
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out ${
              i === index ? 'opacity-100' : 'opacity-0'
            } ${active ? 'scale-100' : 'scale-105'}`}
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-6 left-6 z-10 flex gap-2 sm:bottom-10 sm:left-10">
          {images.map((_, i) => (
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
    </>
  );
}

function DescriptionReveal({ description }: { description: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <p className="flex cursor-default items-center gap-2 text-xs font-bold uppercase tracking-wider text-paper-dim">
        Overview
        <span className={`inline-block transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ⌄
        </span>
      </p>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'mt-2 max-h-40' : 'max-h-0'}`}>
        <p className="text-sm text-paper-dim">{description}</p>
      </div>
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
    closeTimeout.current = window.setTimeout(() => setDisplayedProject(null), 400);
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

  const videoEmbedUrl = displayedProject ? getEmbedUrl(displayedProject.video) : null;

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

      {/* Full-screen project takeover */}
      {displayedProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={displayedProject.title}
          onClick={closeProject}
          className={`fixed inset-0 z-[150] overflow-hidden transition-opacity duration-[400ms] ${
            activeProject ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ModalBackground project={displayedProject} active={!!activeProject} />

          {/* legibility gradients: dark toward the info panel edge */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ink-950/30 to-ink-950/90 md:via-ink-950/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent md:hidden" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              closeProject();
            }}
            className="absolute right-6 top-8 z-20 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:text-accent-2 sm:right-10 sm:top-10"
          >
            Close <span aria-hidden="true">✕</span>
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end gap-4 p-6 pt-24 sm:p-10 md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md md:justify-center md:gap-5 md:p-14"
          >
            <div className="flex flex-wrap gap-2">
              {displayedProject.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-paper/30 px-3 py-1 text-xs font-semibold text-paper"
                >
                  {tech}
                </span>
              ))}
            </div>

            <h2 className="font-display text-3xl font-extrabold text-paper drop-shadow sm:text-4xl">
              {displayedProject.title}
            </h2>

            <DescriptionReveal description={displayedProject.description} />

            {videoEmbedUrl && (
              <div className="aspect-video w-full max-w-xs overflow-hidden rounded-lg bg-ink-900 shadow-lg">
                <iframe
                  className="h-full w-full"
                  src={videoEmbedUrl}
                  title={`${displayedProject.title} video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <a
              href={`/projects/${displayedProject.slug}`}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-accent-2"
            >
              View Full Case Study →
            </a>
          </div>
        </div>
      )}
    </>
  );
}
