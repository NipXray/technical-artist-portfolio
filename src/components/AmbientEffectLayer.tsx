import { useMemo } from 'react';

export type AmbientEffectType = 'none' | 'smoke' | 'embers' | 'dust' | 'snow' | 'fireflies';

interface AmbientParticle {
  id: number;
  style: React.CSSProperties;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

const COUNTS: Record<Exclude<AmbientEffectType, 'none'>, number> = {
  smoke: 10,
  embers: 22,
  dust: 26,
  snow: 30,
  fireflies: 18
};

function buildParticles(type: Exclude<AmbientEffectType, 'none'>): AmbientParticle[] {
  const count = COUNTS[type];
  return Array.from({ length: count }, (_, i) => {
    const base: React.CSSProperties = {
      left: `${rand(0, 100)}%`,
      animationDelay: `${rand(0, 8)}s`
    };

    switch (type) {
      case 'smoke':
        return {
          id: i,
          style: {
            ...base,
            bottom: `${rand(-10, 10)}%`,
            width: `${rand(90, 220)}px`,
            height: `${rand(90, 220)}px`,
            animationDuration: `${rand(9, 16)}s`,
            ['--drift-x' as string]: `${rand(-8, 8)}%`
          }
        };
      case 'embers':
        return {
          id: i,
          style: {
            ...base,
            bottom: `${rand(-5, 5)}%`,
            width: `${rand(3, 6)}px`,
            height: `${rand(3, 6)}px`,
            animationDuration: `${rand(4, 8)}s`,
            ['--drift-x' as string]: `${rand(-6, 6)}%`
          }
        };
      case 'dust':
        return {
          id: i,
          style: {
            ...base,
            top: `${rand(0, 100)}%`,
            width: `${rand(1.5, 3)}px`,
            height: `${rand(1.5, 3)}px`,
            animationDuration: `${rand(6, 14)}s`,
            ['--drift-x' as string]: `${rand(-10, 10)}%`,
            ['--drift-y' as string]: `${rand(-15, 15)}%`
          }
        };
      case 'snow':
        return {
          id: i,
          style: {
            ...base,
            top: `${rand(-10, -2)}%`,
            width: `${rand(3, 6)}px`,
            height: `${rand(3, 6)}px`,
            animationDuration: `${rand(8, 16)}s`,
            ['--drift-x' as string]: `${rand(-8, 8)}%`
          }
        };
      case 'fireflies':
        return {
          id: i,
          style: {
            ...base,
            top: `${rand(10, 90)}%`,
            width: `${rand(2.5, 4.5)}px`,
            height: `${rand(2.5, 4.5)}px`,
            animationDuration: `${rand(3, 6)}s`,
            ['--drift-x' as string]: `${rand(-4, 4)}%`
          }
        };
    }
  });
}

export default function AmbientEffectLayer({
  type,
  videoUrl,
  active
}: {
  type: AmbientEffectType;
  videoUrl?: string;
  active: boolean;
}) {
  const particles = useMemo(() => (type === 'none' ? [] : buildParticles(type)), [type]);

  if (videoUrl) {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover mix-blend-screen opacity-40"
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        style={{ display: active ? 'block' : 'none' }}
      />
    );
  }

  if (type === 'none' || !active) return null;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span key={p.id} className={`ambient-particle ambient-${type}`} style={p.style} />
      ))}
    </div>
  );
}
