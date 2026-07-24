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
  | 'sparkle'
  | 'domain-slash';

export interface EffectTriggerDetail {
  type: ClickEffectType;
  x: number;
  y: number;
  /** Called once the effect has finished playing. Omit for fire-and-forget. */
  onComplete?: () => void;
  /**
   * Only used by 'domain-slash': the clicked card's own on-screen rect and
   * image, so it can be cloned and split in place instead of just drawing
   * particles on top of it. Falls back to a plain slash if omitted.
   */
  rect?: { left: number; top: number; width: number; height: number };
  imageSrc?: string;
}

interface Particle {
  id: number;
  className: string;
  style: React.CSSProperties;
  content?: string;
}

interface DomainCut {
  imageSrc: string;
  rect: { left: number; top: number; width: number; height: number };
  lineStyle: React.CSSProperties;
  leftStyle: React.CSSProperties;
  rightStyle: React.CSSProperties;
}

const EFFECT_DURATION = 750;
// Smoke/explosion now carry longer-tailed particles (billowing puffs, drifting
// aftermath) that outlast the default window — give them room to finish.
const EFFECT_DURATION_OVERRIDES: Partial<Record<ClickEffectType, number>> = {
  smoke: 1900,
  explosion: 1350,
  skull: 1300
};

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
  // Layered: a few large slow-billowing puffs behind several smaller,
  // faster wisps in front, so the plume reads as volumetric rather than
  // a handful of flat identical circles.
  const puffs = Array.from({ length: 5 }, (_, i) => {
    const size = rand(70, 130);
    return {
      id: i,
      className: 'particle particle-smoke',
      style: {
        left: `${x + rand(-16, 16) - size / 2}px`,
        top: `${y + rand(-8, 8) - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${rand(0, 120)}ms`,
        animationDuration: `${rand(1100, 1600)}ms`,
        ['--rise' as string]: `${-rand(160, 260)}px`,
        ['--drift' as string]: `${rand(-50, 50)}px`,
        ['--spin' as string]: `${rand(-40, 40)}deg`
      }
    };
  });
  const wisps = Array.from({ length: 9 }, (_, i) => {
    const size = rand(22, 46);
    return {
      id: i + puffs.length,
      className: 'particle particle-smoke',
      style: {
        left: `${x + rand(-26, 26) - size / 2}px`,
        top: `${y + rand(-14, 14) - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${rand(0, 200)}ms`,
        animationDuration: `${rand(650, 1000)}ms`,
        ['--rise' as string]: `${-rand(90, 180)}px`,
        ['--drift' as string]: `${rand(-60, 60)}px`,
        ['--spin' as string]: `${rand(-60, 60)}deg`
      }
    };
  });
  return [...puffs, ...wisps];
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
  // A single decisive cut straight across the viewport — picks one
  // direction (left-to-right or right-to-left) per click rather than
  // two crossing diagonals, which read as a messy X instead of a slash.
  const leftToRight = Math.random() < 0.5;
  const angle = leftToRight ? -6 : 6;
  const startX = leftToRight ? -70 : 100;
  const endX = leftToRight ? 100 : -70;
  return [
    {
      id: 0,
      className: 'particle particle-slash',
      style: {
        top: `${y - 2}px`,
        animationDuration: '420ms',
        ['--angle' as string]: `${angle}deg`,
        ['--start-x' as string]: `${startX}vw`,
        ['--end-x' as string]: `${endX}vw`
      }
    },
    // A thinner, brighter leading edge just ahead of the main blade —
    // reads as a keen edge cutting first, with the glow trailing it.
    {
      id: 1,
      className: 'particle particle-slash-edge',
      style: {
        top: `${y - 2}px`,
        animationDelay: '30ms',
        animationDuration: '380ms',
        ['--angle' as string]: `${angle}deg`,
        ['--start-x' as string]: `${startX}vw`,
        ['--end-x' as string]: `${endX}vw`
      }
    }
  ];
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
  // Departing souls fan out upward from the point of impact, rather than
  // gathering inward toward it — reads as spirits escaping/scattering, not
  // energy being drawn into a center.
  const souls = Array.from({ length: 12 }, (_, i) => {
    const angle = -Math.PI / 2 + rand(-1.15, 1.15);
    const radius = rand(120, 260);
    const size = rand(8, 15);
    return {
      id: i + 1,
      className: 'particle particle-soul',
      style: {
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${rand(0, 180)}ms`,
        animationDuration: `${rand(700, 1050)}ms`,
        ['--target-x' as string]: `${Math.cos(angle) * radius}px`,
        ['--target-y' as string]: `${Math.sin(angle) * radius}px`
      }
    };
  });
  return [main, ...souls];
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
  const shockwave: Particle = {
    id: 1,
    className: 'particle particle-shockwave',
    style: { left: `${x - 4}px`, top: `${y - 4}px`, animationDuration: '550ms' }
  };
  const embers = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + rand(-0.15, 0.15);
    const radius = rand(110, 280);
    const size = rand(4, 9);
    return {
      id: i + 2,
      className: 'particle particle-explosion-ember',
      style: {
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${rand(0, 80)}ms`,
        animationDuration: `${rand(450, 700)}ms`,
        ['--target-x' as string]: `${Math.cos(angle) * radius}px`,
        ['--target-y' as string]: `${Math.sin(angle) * radius}px`
      }
    };
  });
  const aftermathSmoke = Array.from({ length: 6 }, (_, i) => {
    const size = rand(50, 100);
    const angle = rand(0, Math.PI * 2);
    const driftRadius = rand(20, 60);
    return {
      id: i + 20,
      className: 'particle particle-smoke',
      style: {
        left: `${x + Math.cos(angle) * driftRadius - size / 2}px`,
        top: `${y + Math.sin(angle) * driftRadius - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${rand(120, 260)}ms`,
        animationDuration: `${rand(700, 1000)}ms`,
        ['--rise' as string]: `${-rand(60, 130)}px`,
        ['--drift' as string]: `${rand(-40, 40)}px`,
        ['--spin' as string]: `${rand(-30, 30)}deg`
      }
    };
  });
  return [flash, shockwave, ...embers, ...aftermathSmoke];
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

// Matches the intro sequence's own diagonal cut angle (18deg from
// vertical), so this reads as the same visual language rather than a new one.
const DOMAIN_LEAN_DEG = 18;

// "Domain Slash" clones the clicked card's own image and splits it in two,
// instead of drawing particles on top of it — a slash line crosses the
// card, then the two halves pull apart to reveal the project underneath.
// Always cuts dead-center on a consistent diagonal lean, regardless of
// where inside the card the click actually landed.
function buildDomainCut(
  rect: { left: number; top: number; width: number; height: number },
  imageSrc: string
): DomainCut {
  const leanRight = Math.random() < 0.5; // true: "\", false: "/"
  // CSS rotate() is clockwise for positive angles: rotating a vertical bar
  // by +deg swings its top right and bottom left, which is a "/" shape —
  // the opposite of what "\" (leanRight) needs, hence the sign flip here.
  const angle = leanRight ? -DOMAIN_LEAN_DEG : DOMAIN_LEAN_DEG;

  // How far the seam drifts sideways from top to bottom, as a % of the
  // card's own width — derived from the lean angle and the card's aspect
  // ratio so the same angle reads consistently on any card size, clamped
  // so extreme (very short/wide) cards don't produce an absurd shear.
  const shiftPct = Math.min(42, ((Math.tan((DOMAIN_LEAN_DEG * Math.PI) / 180) * rect.height) / rect.width) * 100);
  const topX = leanRight ? 50 - shiftPct / 2 : 50 + shiftPct / 2;
  const bottomX = leanRight ? 50 + shiftPct / 2 : 50 - shiftPct / 2;

  const barHeight = rect.height * 1.35;
  const clearance = rect.width * 0.75 + 40;
  const startX = leanRight ? -clearance : clearance;

  const lineStyle: React.CSSProperties = {
    left: `${rect.left + rect.width / 2 - 3}px`,
    top: `${rect.top + rect.height / 2 - barHeight / 2}px`,
    height: `${barHeight}px`,
    animationDuration: '340ms',
    ['--start-x' as string]: `${startX}px`,
    ['--end-x' as string]: `${-startX}px`,
    ['--angle' as string]: `${angle}deg`
  };

  const splitDistance = Math.max(28, rect.width * 0.1);
  const halfBase: React.CSSProperties = {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  };

  return {
    imageSrc,
    rect,
    lineStyle,
    leftStyle: {
      ...halfBase,
      clipPath: `polygon(0% 0%, ${topX}% 0%, ${bottomX}% 100%, 0% 100%)`,
      ['--split' as string]: `-${splitDistance}px`
    },
    rightStyle: {
      ...halfBase,
      clipPath: `polygon(${topX}% 0%, 100% 0%, 100% 100%, ${bottomX}% 100%)`,
      ['--split' as string]: `${splitDistance}px`
    }
  };
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
  const [domainCut, setDomainCut] = useState<DomainCut | null>(null);

  useEffect(() => {
    function handleTrigger(e: Event) {
      const { type, x, y, onComplete, rect, imageSrc } = (e as CustomEvent<EffectTriggerDetail>).detail;
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

      if (type === 'domain-slash' && rect && imageSrc) {
        setDomainCut(buildDomainCut(rect, imageSrc));
        window.setTimeout(() => onComplete?.(), 750);
        window.setTimeout(() => setDomainCut(null), 900);
        return;
      }

      setEffect({ type, particles: buildParticles(type, x, y) });
      // Keep the interaction snappy — open the project on the usual timer —
      // but let any longer-tailed particles (smoke, embers) keep drifting and
      // clear on their own schedule, on top of the now-open project.
      window.setTimeout(() => onComplete?.(), EFFECT_DURATION);
      window.setTimeout(() => setEffect(null), EFFECT_DURATION_OVERRIDES[type] ?? EFFECT_DURATION);
    }

    // Defensive fix: if this page is restored from the back-forward cache
    // mid-animation, clear any stuck effect so the full-screen overlay
    // (which would otherwise swallow every click) can't survive a reload-free
    // back navigation.
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        setEffect(null);
        setDomainCut(null);
      }
    }

    window.addEventListener('effect-trigger', handleTrigger);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('effect-trigger', handleTrigger);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  if (!effect && !domainCut) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden" aria-hidden="true">
      {effect?.particles.map((p) => (
        <span key={p.id} className={p.className} style={p.style}>
          {p.content}
        </span>
      ))}
      {domainCut && (
        <>
          <div className="particle domain-slash-line" style={domainCut.lineStyle} />
          <img src={domainCut.imageSrc} alt="" className="domain-cut-half domain-cut-left" style={domainCut.leftStyle} />
          <img src={domainCut.imageSrc} alt="" className="domain-cut-half domain-cut-right" style={domainCut.rightStyle} />
        </>
      )}
    </div>
  );
}
