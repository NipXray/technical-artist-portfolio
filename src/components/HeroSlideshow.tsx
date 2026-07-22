import { useEffect, useRef, useState } from 'react';

export interface HeroSlide {
  type?: 'image' | 'video';
  src: string;
  duration: number;
  caption?: string;
}

// The CMS used to require a manual "image"/"video" toggle alongside the file
// upload, and it was easy to swap in a video without remembering to flip it
// — the slide would then render as a broken <img>. Detecting from the file
// extension is always correct since it comes from the actual uploaded file.
const VIDEO_EXTENSION = /\.(mp4|webm|mov|m4v)$/i;
function isVideoSlide(slide: HeroSlide) {
  return VIDEO_EXTENSION.test(slide.src) || slide.type === 'video';
}

export default function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Any video slide restarts from frame 0 the moment it becomes active, and
  // pauses when it isn't — so if two clips (e.g. a "solid" pass and a
  // "material" pass of the same render) are the same length, they always
  // line up on the same frame every time the slideshow cycles round to
  // them, rather than merely happening to line up because both started
  // autoplaying at page load.
  useEffect(() => {
    videoRefs.current.forEach((videoEl, i) => {
      if (i === active) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    });
  }, [active]);

  // Slides always advance on a timer — "reduce motion" trims the fade
  // transition below, it doesn't freeze the slideshow on slide one.
  useEffect(() => {
    if (slides.length < 2) return undefined;

    const duration = Math.max(2, slides[active]?.duration ?? 6) * 1000;
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
      {slides.map((slide, i) => (
        <div
          key={slide.src + i}
          className={`absolute inset-0 ease-in-out ${reduceMotion ? 'transition-opacity duration-200' : 'transition-opacity duration-[1500ms]'}`}
          style={{ opacity: i === active ? 1 : 0 }}
          aria-hidden={i !== active}
        >
          {isVideoSlide(slide) ? (
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(i, el);
                else videoRefs.current.delete(i);
              }}
              className="h-full w-full object-cover"
              src={slide.src}
              muted
              loop
              playsInline
            />
          ) : (
            <img src={slide.src} alt={slide.caption ?? ''} className="h-full w-full object-cover" />
          )}
        </div>
      ))}
    </div>
  );
}
