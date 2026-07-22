import { useEffect, useRef, useState } from 'react';

export interface HeroSlide {
  type: 'image' | 'video';
  src: string;
  duration: number;
  caption?: string;
}

export default function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length < 2) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

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
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
          aria-hidden={i !== active}
        >
          {slide.type === 'video' ? (
            <video
              className="h-full w-full object-cover"
              src={slide.src}
              autoPlay
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
