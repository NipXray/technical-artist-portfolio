import { useMemo } from 'react';

export type AmbientEffectType = 'none' | 'smoke' | 'embers' | 'dust' | 'snow' | 'fireflies' | 'fog';

interface AmbientParticle {
  id: number;
  className: string;
  style: React.CSSProperties;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// --- Template system -------------------------------------------------
// Every preset below is just numbers: how many, how big, how long they
// live, and how far they drift. To add a new "particle" style effect,
// add an entry here — no rendering code needs to change. "fog" uses a
// different renderer (drifting textured bands) since it isn't made of
// discrete specks; see `bandPreset` further down.

interface ParticlePreset {
  kind: 'particles';
  count: number;
  size: [number, number];
  duration: [number, number];
  delay: [number, number];
  driftX?: [number, number];
  driftY?: [number, number];
  /** Where particles spawn vertically. 'bottom'/'top' anchor near that edge with slight jitter; 'spread' scatters across the full height. */
  anchor: 'bottom' | 'top' | 'spread';
}

interface BandPreset {
  kind: 'bands';
  count: number;
  /** 'alternate' splits bands evenly between left->right and right->left. */
  direction: 'ltr' | 'rtl' | 'alternate';
  heightPct: [number, number];
  bottomPct: [number, number];
  duration: [number, number];
  delay: [number, number];
}

type Preset = ParticlePreset | BandPreset;

const PRESETS: Record<Exclude<AmbientEffectType, 'none'>, Preset> = {
  smoke: {
    kind: 'particles',
    count: 10,
    size: [90, 220],
    duration: [9, 16],
    delay: [0, 8],
    driftX: [-8, 8],
    anchor: 'bottom'
  },
  embers: {
    kind: 'particles',
    count: 22,
    size: [3, 6],
    duration: [4, 8],
    delay: [0, 8],
    driftX: [-6, 6],
    anchor: 'bottom'
  },
  dust: {
    kind: 'particles',
    count: 26,
    size: [1.5, 3],
    duration: [6, 14],
    delay: [0, 8],
    driftX: [-10, 10],
    driftY: [-15, 15],
    anchor: 'spread'
  },
  snow: {
    kind: 'particles',
    count: 30,
    size: [3, 6],
    duration: [8, 16],
    delay: [0, 8],
    driftX: [-8, 8],
    anchor: 'top'
  },
  fireflies: {
    kind: 'particles',
    count: 18,
    size: [2.5, 4.5],
    duration: [3, 6],
    delay: [0, 8],
    driftX: [-4, 4],
    anchor: 'spread'
  },
  fog: {
    kind: 'bands',
    count: 6,
    direction: 'alternate',
    heightPct: [18, 36],
    bottomPct: [-8, 14],
    duration: [24, 40],
    delay: [0, 10]
  }
};

function buildParticles(type: Exclude<AmbientEffectType, 'none'>, preset: ParticlePreset): AmbientParticle[] {
  return Array.from({ length: preset.count }, (_, i) => {
    const size = rand(...preset.size);
    const style: React.CSSProperties = {
      left: `${rand(0, 100)}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: `${rand(...preset.duration)}s`,
      animationDelay: `${rand(...preset.delay)}s`,
      ['--drift-x' as string]: preset.driftX ? `${rand(...preset.driftX)}%` : undefined,
      ['--drift-y' as string]: preset.driftY ? `${rand(...preset.driftY)}%` : undefined
    };

    if (preset.anchor === 'bottom') style.bottom = `${rand(-10, 10)}%`;
    else if (preset.anchor === 'top') style.top = `${rand(-10, -2)}%`;
    else style.top = `${rand(0, 100)}%`;

    return { id: i, className: `ambient-particle ambient-${type}`, style };
  });
}

function buildBands(preset: BandPreset): AmbientParticle[] {
  return Array.from({ length: preset.count }, (_, i) => {
    const goingRight = preset.direction === 'ltr' || (preset.direction === 'alternate' && i % 2 === 0);
    return {
      id: i,
      className: `ambient-particle ambient-fog-band ${goingRight ? 'fog-ltr' : 'fog-rtl'}`,
      style: {
        height: `${rand(...preset.heightPct)}%`,
        bottom: `${rand(...preset.bottomPct)}%`,
        animationDuration: `${rand(...preset.duration)}s`,
        animationDelay: `${rand(...preset.delay)}s`
      }
    };
  });
}

function buildEffect(type: Exclude<AmbientEffectType, 'none'>): AmbientParticle[] {
  const preset = PRESETS[type];
  return preset.kind === 'bands' ? buildBands(preset) : buildParticles(type, preset);
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
  const particles = useMemo(() => (type === 'none' ? [] : buildEffect(type)), [type]);

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
      {type === 'fog' && (
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id="ambient-fog-texture" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.045" numOctaves={3} seed={7} result="noise" />
              <feColorMatrix
                in="noise"
                type="matrix"
                values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.1 0"
                result="alphaNoise"
              />
              <feGaussianBlur in="alphaNoise" stdDeviation="1.6" result="softNoise" />
              <feComposite in="softNoise" in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
        </svg>
      )}
      {particles.map((p) => (
        <span key={p.id} className={p.className} style={p.style} />
      ))}
    </div>
  );
}
