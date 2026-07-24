import { useEffect, useMemo, useRef, useState } from 'react';
import { getEmbedUrl } from '../lib/embed';
import type { ClickEffectType, EffectTriggerDetail } from './ClickEffectLayer';
import AmbientEffectLayer, { type AmbientEffectType } from './AmbientEffectLayer';
import CaseStudySidebar from './CaseStudySidebar';

export interface ShowcaseProject {
  slug: string;
  title: string;
  cover: string;
  gallery: string[];
  video?: string;
  description: string;
  techStack: string[];
  clickEffect: ClickEffectType;
  ambientEffect: AmbientEffectType;
  ambientEffectScope: 'all' | 'first';
  ambientVideoUrl?: string;
  galleryVideoPlayback: 'fixed' | 'full';
}

const VIDEO_EXTENSION = /\.(mp4|webm|mov|m4v|mkv)$/i;
function isVideoSrc(src: string) {
  return VIDEO_EXTENSION.test(src);
}

// Resets to frame 0 and plays only while `active`, matching the Hero
// Slideshow's behavior so gallery clips restart cleanly each time they cycle in.
// `loop` keeps a short clip filling out a fixed-duration slide instead of
// freezing on its last frame; when playing to full length instead, it stays
// unlooped so `onEnded` fires exactly once to advance the slideshow.
function ModalSlideMedia({
  src,
  active,
  alt,
  loop,
  onEnded
}: {
  src: string;
  active: boolean;
  alt: string;
  loop: boolean;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) {
      el.currentTime = 0;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [active]);

  if (isVideoSrc(src)) {
    return (
      <video
        ref={videoRef}
        src={src}
        muted
        loop={loop}
        playsInline
        onEnded={active ? onEnded : undefined}
        className="h-full w-full object-cover"
      />
    );
  }
  return <img src={src} alt={alt} className="h-full w-full object-cover" />;
}

function ModalBackground({
  project,
  active,
  index,
  onVideoEnded
}: {
  project: ShowcaseProject;
  active: boolean;
  index: number;
  onVideoEnded: () => void;
}) {
  const images = useMemo(
    () => [project.cover, ...project.gallery].filter((src, i, arr) => src && arr.indexOf(src) === i),
    [project]
  );
  const safeIndex = index % images.length;
  const playFull = project.galleryVideoPlayback === 'full';

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-900">
      {images.map((src, i) => (
        <div
          key={src + i}
          className={`absolute inset-0 transition-[opacity,transform] duration-[1200ms] ease-out ${
            i === safeIndex ? 'opacity-100' : 'opacity-0'
          } ${active ? 'scale-100' : 'scale-105'}`}
        >
          <ModalSlideMedia
            src={src}
            active={active && i === safeIndex}
            alt={project.title}
            loop={!playFull}
            onEnded={playFull ? onVideoEnded : undefined}
          />
        </div>
      ))}
    </div>
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
  const [slideIndex, setSlideIndex] = useState(0);
  const [caseStudySlug, setCaseStudySlug] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [cuttingSlug, setCuttingSlug] = useState<string | null>(null);
  const closeTimeout = useRef<number | null>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const displayedImages = useMemo(() => {
    if (!displayedProject) return [];
    return [displayedProject.cover, ...displayedProject.gallery].filter(
      (src, i, arr) => src && arr.indexOf(src) === i
    );
  }, [displayedProject]);

  function openProject(project: ShowcaseProject) {
    if (closeTimeout.current) window.clearTimeout(closeTimeout.current);
    setSlideIndex(0);
    setDisplayedProject(project);
    requestAnimationFrame(() => setActiveProject(project));
  }

  function closeProject() {
    setActiveProject(null);
    setCaseStudySlug(null);
    closeTimeout.current = window.setTimeout(() => setDisplayedProject(null), 400);
  }

  function handlePanelClick(project: ShowcaseProject, e: React.MouseEvent) {
    const isDomainSlash = project.clickEffect === 'domain-slash';
    if (isDomainSlash) setCuttingSlug(project.slug);
    const rect = e.currentTarget.getBoundingClientRect();
    const detail: EffectTriggerDetail = {
      type: project.clickEffect,
      x: e.clientX,
      y: e.clientY,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      imageSrc: project.cover,
      onComplete: () => {
        openProject(project);
        if (isDomainSlash) setCuttingSlug(null);
      }
    };
    window.dispatchEvent(new CustomEvent('effect-trigger', { detail }));
  }

  function advanceSlide() {
    setSlideIndex((i) => (i + 1) % displayedImages.length);
  }

  // Auto-advance the background slideshow on a fixed timer — unless this
  // project plays gallery videos to their full length, in which case the
  // current video's own `onEnded` (wired below) drives the advance instead.
  useEffect(() => {
    if (!displayedProject || displayedImages.length < 2 || caseStudySlug) return undefined;
    const currentSrc = displayedImages[slideIndex % displayedImages.length];
    if (displayedProject.galleryVideoPlayback === 'full' && isVideoSrc(currentSrc)) return undefined;
    const t = window.setTimeout(advanceSlide, 5000);
    return () => window.clearTimeout(t);
  }, [slideIndex, displayedProject, displayedImages, caseStudySlug]);

  // Escape closes the case study first, then the project; arrows drive the slideshow.
  useEffect(() => {
    if (!displayedProject) return undefined;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (caseStudySlug) setCaseStudySlug(null);
        else closeProject();
        return;
      }
      if (caseStudySlug) return; // let the reader scroll without hijacking arrow keys
      if (displayedImages.length < 2) return;
      if (e.key === 'ArrowRight') {
        setSlideIndex((i) => (i + 1) % displayedImages.length);
      } else if (e.key === 'ArrowLeft') {
        setSlideIndex((i) => (i - 1 + displayedImages.length) % displayedImages.length);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [displayedProject, caseStudySlug, displayedImages]);

  const videoEmbedUrl = displayedProject ? getEmbedUrl(displayedProject.video) : null;

  return (
    <>
      {/* Seamless hover-accordion gallery */}
      <div
        className={`flex h-[85vh] max-h-[820px] min-h-[520px] flex-col transition-all duration-700 ease-out md:h-[78vh] md:flex-row ${
          revealed ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {projects.map((project, i) => {
          const isHovered = hovered === i;
          return (
            <button
              key={project.slug}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => handlePanelClick(project, e)}
              style={{
                flexGrow: hovered === null ? 1 : isHovered ? 3.4 : 0.55,
                transitionDelay: revealed ? `${i * 70}ms` : '0ms'
              }}
              className={`group relative min-h-[110px] flex-1 appearance-none overflow-hidden border-0 bg-transparent p-0 text-left transition-[flex-grow,clip-path] duration-500 ease-out ${
                revealed ? '[clip-path:inset(0_0_0_0)]' : '[clip-path:inset(50%_0_50%_0)]'
              } ${cuttingSlug === project.slug ? 'invisible' : ''}`}
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
                      className="rounded-none bg-ink-950/70 px-3 py-1 text-xs font-semibold text-accent-2"
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
          <ModalBackground
            project={displayedProject}
            active={!!activeProject}
            index={slideIndex}
            onVideoEnded={advanceSlide}
          />
          <AmbientEffectLayer
            type={displayedProject.ambientEffect}
            videoUrl={displayedProject.ambientVideoUrl}
            active={!!activeProject && (displayedProject.ambientEffectScope === 'all' || slideIndex === 0)}
          />

          {displayedImages.length > 1 && (
            <div className="absolute bottom-6 left-6 z-10 flex gap-2 sm:bottom-10 sm:left-10">
              {displayedImages.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlideIndex(i);
                  }}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-none transition-all ${
                    i === slideIndex ? 'w-6 bg-accent' : 'w-2 bg-paper/40 hover:bg-paper/70'
                  }`}
                />
              ))}
            </div>
          )}

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
                  className="rounded-none border border-paper/30 px-3 py-1 text-xs font-semibold text-paper"
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

            <button
              onClick={(e) => {
                e.stopPropagation();
                setCaseStudySlug(displayedProject.slug);
              }}
              className="inline-flex w-fit items-center gap-2 rounded-none bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-accent-2"
            >
              View Full Case Study →
            </button>
          </div>
        </div>
      )}

      <CaseStudySidebar slug={caseStudySlug} onClose={() => setCaseStudySlug(null)} />
    </>
  );
}
