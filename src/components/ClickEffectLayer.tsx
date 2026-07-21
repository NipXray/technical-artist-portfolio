import { useEffect, useState } from 'react';

export type ClickEffectType = 'none' | 'leaf' | 'smoke' | 'converge';

interface NavigateDetail {
  type: ClickEffectType;
  href: string;
  x: number;
  y: number;
}

interface Particle {
  id: number;
  style: React.CSSProperties;
}

const EFFECT_DURATION = 750;

function buildLeafParticles(): Particle[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 300}ms`,
      animationDuration: `${900 + Math.random() * 500}ms`,
      ['--sway' as string]: `${(Math.random() - 0.5) * 160}px`,
      ['--spin' as string]: `${180 + Math.random() * 360}deg`
    }
  }));
}

function buildSmokeParticles(x: number, y: number): Particle[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    style: {
      left: `${x + (Math.random() - 0.5) * 40}px`,
      top: `${y + (Math.random() - 0.5) * 20}px`,
      animationDelay: `${Math.random() * 150}ms`,
      animationDuration: `${600 + Math.random() * 400}ms`,
      ['--rise' as string]: `${-(100 + Math.random() * 100)}px`,
      ['--drift' as string]: `${(Math.random() - 0.5) * 80}px`
    }
  }));
}

function buildConvergeParticles(x: number, y: number): Particle[] {
  return Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const radius = 260 + Math.random() * 160;
    const startX = x + Math.cos(angle) * radius;
    const startY = y + Math.sin(angle) * radius;
    return {
      id: i,
      style: {
        left: `${startX}px`,
        top: `${startY}px`,
        animationDelay: `${Math.random() * 120}ms`,
        animationDuration: `${500 + Math.random() * 250}ms`,
        ['--target-x' as string]: `${x - startX}px`,
        ['--target-y' as string]: `${y - startY}px`
      }
    };
  });
}

export default function ClickEffectLayer() {
  const [effect, setEffect] = useState<{ type: ClickEffectType; particles: Particle[] } | null>(null);

  useEffect(() => {
    function handleNavigate(e: Event) {
      const { type, href, x, y } = (e as CustomEvent<NavigateDetail>).detail;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (type === 'none' || reduceMotion) {
        window.location.href = href;
        return;
      }

      const particles =
        type === 'leaf'
          ? buildLeafParticles()
          : type === 'smoke'
            ? buildSmokeParticles(x, y)
            : buildConvergeParticles(x, y);

      setEffect({ type, particles });
      window.setTimeout(() => {
        window.location.href = href;
      }, EFFECT_DURATION);
    }

    window.addEventListener('project-navigate', handleNavigate);
    return () => window.removeEventListener('project-navigate', handleNavigate);
  }, []);

  if (!effect) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" aria-hidden="true">
      {effect.particles.map((p) => (
        <span key={p.id} className={`particle particle-${effect.type}`} style={p.style} />
      ))}
    </div>
  );
}
