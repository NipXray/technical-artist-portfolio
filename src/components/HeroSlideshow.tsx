import { useEffect, useRef, useState } from 'react';

export interface SingleSlide {
  slideKind?: 'single';
  /** Legacy field from before video/image detection was extension-based. */
  type?: 'image' | 'video';
  src: string;
  duration: number;
  caption?: string;
}

export interface CompareSource {
  src: string;
  label?: string;
}

export interface CompareSlide {
  slideKind: 'compare';
  mode: 'fade' | 'split-horizontal' | 'split-vertical';
  sources: CompareSource[];
  duration: number;
  caption?: string;
}

export type HeroSlide = SingleSlide | CompareSlide;

const VIDEO_EXTENSION = /\.(mp4|webm|mov|m4v)$/i;
function isVideoSrc(src: string, legacyType?: 'image' | 'video') {
  return VIDEO_EXTENSION.test(src) || legacyType === 'video';
}

function isCompareSlide(slide: HeroSlide): slide is CompareSlide {
  return (slide as CompareSlide).slideKind === 'compare';
}

function slideDurationSeconds(slide: HeroSlide) {
  if (isCompareSlide(slide) && slide.mode === 'fade') {
    // Each source gets its own turn before the group hands off to the next
    // top-level slide, so the group's total on-screen time is per-source ×
    // however many sources it has.
    return Math.max(2, slide.duration ?? 4) * Math.max(1, slide.sources.length || 1);
  }
  return Math.max(2, slide.duration ?? 6);
}

// A single <video> that resets to frame 0 and plays only while `active` —
// this is what keeps multiple clips of the same shot frame-aligned instead
// of just happening to line up because they started together.
function SyncedVideo({ src, active, className }: { src: string; active: boolean; className: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) {
      el.currentTime = 0;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [active]);

  return <video ref={ref} className={className} src={src} muted loop playsInline />;
}

function clipPathFor(mode: 'split-horizontal' | 'split-vertical', index: number, count: number) {
  const start = (index / count) * 100;
  const end = ((count - index - 1) / count) * 100;
  return mode === 'split-horizontal' ? `inset(0 ${end}% 0 ${start}%)` : `inset(${start}% 0 ${end}% 0)`;
}

function CompareSlideView({ slide, active }: { slide: CompareSlide; active: boolean }) {
  const [subIndex, setSubIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  // Restart the internal fade cycle from the first source every time this
  // group becomes the active top-level slide, and advance through the rest
  // on its own timer while active.
  useEffect(() => {
    if (!active) {
      setSubIndex(0);
      return undefined;
    }
    if (slide.mode !== 'fade' || slide.sources.length < 2) return undefined;

    const perSource = Math.max(2, slide.duration ?? 4) * 1000;
    timeoutRef.current = window.setTimeout(() => {
      setSubIndex((i) => (i + 1) % slide.sources.length);
    }, perSource);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [active, subIndex, slide]);

  if (slide.mode === 'fade') {
    return (
      <>
        {slide.sources.map((source, i) => (
          <div
            key={source.src + i}
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
            style={{ opacity: active && i === subIndex ? 1 : 0 }}
          >
            <SyncedVideo src={source.src} active={active && i === subIndex} className="h-full w-full object-cover" />
          </div>
        ))}
      </>
    );
  }

  // split-horizontal ("left/right") or split-vertical ("up/down") — every
  // source plays simultaneously, each clipped to its own equal share of the
  // frame, with thin divider lines between them.
  const count = Math.max(1, slide.sources.length);
  return (
    <>
      {slide.sources.map((source, i) => (
        <div key={source.src + i} className="absolute inset-0" style={{ clipPath: clipPathFor(slide.mode, i, count) }}>
          <SyncedVideo src={source.src} active={active} className="h-full w-full object-cover" />
        </div>
      ))}
      {Array.from({ length: count - 1 }, (_, i) => {
        const pct = ((i + 1) / count) * 100;
        return (
          <div
            key={`divider-${i}`}
            className={`absolute bg-paper/50 ${slide.mode === 'split-horizontal' ? 'inset-y-0 w-px' : 'inset-x-0 h-px'}`}
            style={slide.mode === 'split-horizontal' ? { left: `${pct}%` } : { top: `${pct}%` }}
          />
        );
      })}
    </>
  );
}

export default function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Slides always advance on a timer — "reduce motion" trims the fade
  // transition below, it doesn't freeze the slideshow on slide one.
  useEffect(() => {
    if (slides.length < 2) return undefined;

    const duration = slideDurationSeconds(slides[active]) * 1000;
    timeoutRef.current = window.setTimeout(() => {
      setActive((i) => (i + 1) % slides.length);
    }, duration);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [active, slides]);

  if (slides.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) => {
        const isActive = i === active;
        const key = isCompareSlide(slide) ? `compare-${slide.sources[0]?.src ?? i}` : slide.src;
        return (
          <div
            key={key + i}
            className={`absolute inset-0 ease-in-out ${reduceMotion ? 'transition-opacity duration-200' : 'transition-opacity duration-[1500ms]'}`}
            style={{ opacity: isActive ? 1 : 0 }}
            aria-hidden={!isActive}
          >
            {isCompareSlide(slide) ? (
              <CompareSlideView slide={slide} active={isActive} />
            ) : isVideoSrc(slide.src, slide.type) ? (
              <SyncedVideo src={slide.src} active={isActive} className="h-full w-full object-cover" />
            ) : (
              <img src={slide.src} alt={slide.caption ?? ''} className="h-full w-full object-cover" />
            )}
          </div>
        );
      })}
    </div>
  );
}
