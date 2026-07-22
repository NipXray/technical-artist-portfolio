import { useEffect, useState } from 'react';

export type ClickEffectType =
  | 'none'
  | 'leaf'
  | 'smoke'
  | 'converge'
  | 'slash'
  | 'skull'
  | 'glass'
  | 'explosion'
  | 'bubble'
  | 'wind'
  | 'sparkle';

export interface EffectTriggerDetail {
  type: ClickEffectType;
  x: number;
  y: number;
  /** Called once the effect has finished playing. Omit for fire-and-forget. */
  onComplete?: () => void;
}

interface Particle {
  id: number;
  className: string;
  style: React.CSSProperties;
  content?: string;
}

const EFFECT_DURATION = 750;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function buildLeaf(): Particle[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    className: 'particle particle-leaf',
    style: {
      left: `${Math.random() * 100}%`,
      animationDelay: `${rand(0, 300)}ms`,
      animationDuration: `${rand(900, 1400)}ms`,
      ['--sway' as string]: `${rand(-80, 80)}px`,
      ['--spin' as string]: `${rand(180, 540)}deg`
    }
  }));
}

function buildSmoke(x: number, y: number): Particle[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    className: 'particle particle-smoke',
    style: {
      left: `${x + rand(-20, 20)}px`,
      top: `${y + rand(-10, 10)}px`,
      animationDelay: `${rand(0, 150)}ms`,
      animationDuration: `${rand(600, 1000)}ms`,
      ['--rise' as string]: `${-rand(100, 200)}px`,
      ['--drift' as string]: `${rand(-40, 40)}px`
    }
  }));
}

function buildConverge(x: number, y: number): Particle[] {
  return Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const radius = rand(260, 420);
    const startX = x + Math.cos(angle) * radius;
    const startY = y + Math.sin(angle) * radius;
    return {
      id: i,
      className: 'particle particle-converge',
      style: {
        left: `${startX}px`,
        top: `${startY}px`,
        animationDelay: `${rand(0, 120)}ms`,
        animationDuration: `${rand(500, 750)}ms`,
        ['--target-x' as string]: `${x - startX}px`,
        ['--target-y' as string]: `${y - startY}px`
      }
    };
  });
}

function buildSlash(x: number, y: number): Particle[] {
  const angles = [-25, 20];
  return angles.map((angle, i) => ({
    id: i,
    className: 'particle particle-slash',
    style: {
      left: `${x - 100}px`,
      top: `${y}px`,
      animationDelay: `${i * 90}ms`,
      animationDuration: '380ms',
      ['--angle' as string]: `${angle}deg`
    }
  }));
}

function buildSkull(x: number, y: number): Particle[] {
  const main: Particle = {
    id: 0,
    className: 'particle particle-skull',
    content: '💀',
    style: {
      left: `${x - 23}px`,
      top: `${y - 23}px`,
      animationDuration: '700ms'
    }
  };
  const bits = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    const radius = rand(80, 180);
    return {
      id: i + 1,
      className: 'particle particle-skull-bit',
      style: {
        left: `${x}px`,
        top: `${y}px`,
        animationDelay: `${rand(100, 250)}ms`,
        animationDuration: `${rand(400, 600)}ms`,
        ['--target-x' as string]: `${Math.cos(angle) * radius}px`,
        ['--target-y' as string]: `${Math.sin(angle) * radius}px`
      }
    };
  });
  return [main, ...bits];
}

function buildGlass(x: number, y: number): Particle[] {
  const flash: Particle = {
    id: 0,
    className: 'particle particle-glass-flash',
    style: { left: `${x - 20}px`, top: `${y - 20}px`, animationDuration: '400ms' }
  };
  const cracks = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    className: 'particle particle-glass',
    style: {
      left: `${x}px`,
      top: `${y}px`,
      animationDelay: `${rand(0, 60)}ms`,
      animationDuration: `${rand(350, 500)}ms`,
      ['--angle' as string]: `${(i / 9) * 360}deg`
    }
  }));
  return [flash, ...cracks];
}

function buildExplosion(x: number, y: number): Particle[] {
  const flash: Particle = {
    id: 0,
    className: 'particle particle-explosion-flash',
    style: { left: `${x - 15}px`, top: `${y - 15}px`, animationDuration: '450ms' }
  };
  const embers = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const radius = rand(120, 260);
    return {
      id: i + 1,
      className: 'particle particle-explosion-ember',
      style: {
        left: `${x}px`,
        top: `${y}px`,
        animationDelay: `${rand(0, 80)}ms`,
        animationDuration: `${rand(450, 650)}ms`,
        ['--target-x' as string]: `${Math.cos(angle) * radius}px`,
        ['--target-y' as string]: `${Math.sin(angle) * radius}px`
      }
    };
  });
  return [flash, ...embers];
}

function buildBubble(x: number, y: number): Particle[] {
  return Array.from({ length: 9 }, (_, i) => {
    const size = rand(10, 26);
    return {
      id: i,
      className: 'particle particle-bubble',
      style: {
        left: `${x + rand(-50, 50)}px`,
        top: `${y + rand(-10, 10)}px`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${rand(0, 200)}ms`,
        animationDuration: `${rand(700, 1100)}ms`,
        ['--rise' as string]: `${-rand(120, 220)}px`,
        ['--wobble' as string]: `${rand(-30, 30)}px`,
        ['--wobble2' as string]: `${rand(-40, 40)}px`
      }
    };
  });
}

function buildWind(): Particle[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i,
    className: 'particle particle-wind',
    style: {
      top: `${rand(0, 100)}%`,
      width: `${rand(80, 220)}px`,
      animationDelay: `${rand(0, 250)}ms`,
      animationDuration: `${rand(500, 750)}ms`
    }
  }));
}

function buildSparkle(x: number, y: number): Particle[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i,
    className: 'particle particle-sparkle',
    content: i % 2 === 0 ? '✦' : '✧',
    style: {
      left: `${x + rand(-90, 90)}px`,
      top: `${y + rand(-70, 70)}px`,
      animationDelay: `${rand(0, 250)}ms`,
      animationDuration: `${rand(550, 800)}ms`
    }
  }));
}

function buildPulse(x: number, y: number): Particle[] {
  // A single brief, low-motion ring — used instead of the full particle
  // burst when the OS/browser signals prefers-reduced-motion, so a click
  // still gets *some* visible acknowledgement rather than none at all.
  return [
    {
      id: 0,
      className: 'particle particle-pulse',
      style: { left: `${x - 18}px`, top: `${y - 18}px`, animationDuration: '260ms' }
    }
  ];
}

function buildParticles(type: ClickEffectType, x: number, y: number): Particle[] {
  switch (type) {
    case 'leaf':
      return buildLeaf();
    case 'smoke':
      return buildSmoke(x, y);
    case 'converge':
      return buildConverge(x, y);
    case 'slash':
      return buildSlash(x, y);
    case 'skull':
      return buildSkull(x, y);
    case 'glass':
      return buildGlass(x, y);
    case 'explosion':
      return buildExplosion(x, y);
    case 'bubble':
      return buildBubble(x, y);
    case 'wind':
      return buildWind();
    case 'sparkle':
      return buildSparkle(x, y);
    default:
      return [];
  }
}

export default function ClickEffectLayer() {
  const [effect, setEffect] = useState<{ type: ClickEffectType; particles: Particle[] } | null>(null);

  useEffect(() => {
    function handleTrigger(e: Event) {
      const { type, x, y, onComplete } = (e as CustomEvent<EffectTriggerDetail>).detail;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (type === 'none') {
        onComplete?.();
        return;
      }

      if (reduceMotion) {
        setEffect({ type, particles: buildPulse(x, y) });
        window.setTimeout(() => {
          setEffect(null);
          onComplete?.();
        }, 260);
        return;
      }

      setEffect({ type, particles: buildParticles(type, x, y) });
      window.setTimeout(() => {
        setEffect(null);
        onComplete?.();
      }, EFFECT_DURATION);
    }

    // Defensive fix: if this page is restored from the back-forward cache
    // mid-animation, clear any stuck effect so the full-screen overlay
    // (which would otherwise swallow every click) can't survive a reload-free
    // back navigation.
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) setEffect(null);
    }

    window.addEventListener('effect-trigger', handleTrigger);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('effect-trigger', handleTrigger);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  if (!effect) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden" aria-hidden="true">
      {effect.particles.map((p) => (
        <span key={p.id} className={p.className} style={p.style}>
          {p.content}
        </span>
      ))}
    </div>
  );
}
