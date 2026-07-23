import { useEffect, useRef, useState } from 'react';

type Stage = 'title-in' | 'title-out' | 'lines' | 'open-middle' | 'expand' | 'done';
export type IntroStyle = 'elegant' | 'fast';

const SESSION_KEY = 'intro-seen';
// Distance from center to each line — scales with viewport width so the
// gap reads as similarly proportioned on a small laptop and a large desktop
// monitor, instead of hitting a low fixed cap on bigger screens.
const LINE_OFFSET = 'clamp(110px, 15vw, 400px)';
const LINE_ROTATION = 18;

interface Preset {
  titleOutAt: number;
  linesAt: number;
  openMiddleAt: number;
  expandAt: number;
  doneAt: number;
  titleFade: string;
  lineDraw: string;
  lineStagger: number;
  middleDrop: string;
  bandExpand: string;
}

// "elegant" — slower, graceful, generous pauses between beats.
// "fast" — quick, snappy, sharp deceleration curves; barely any hold.
const PRESETS: Record<IntroStyle, Preset> = {
  elegant: {
    titleOutAt: 1200,
    linesAt: 1800,
    openMiddleAt: 2700,
    expandAt: 4300,
    doneAt: 5300,
    titleFade: '600ms cubic-bezier(0.4, 0, 0.2, 1)',
    lineDraw: '800ms cubic-bezier(0.65, 0, 0.35, 1)',
    lineStagger: 120,
    middleDrop: '1200ms cubic-bezier(0.65, 0, 0.35, 1)',
    bandExpand: '900ms cubic-bezier(0.65, 0, 0.35, 1)'
  },
  fast: {
    titleOutAt: 550,
    linesAt: 800,
    openMiddleAt: 1200,
    expandAt: 1650,
    doneAt: 2050,
    titleFade: '220ms cubic-bezier(0.4, 0, 1, 1)',
    lineDraw: '320ms cubic-bezier(0.2, 0, 0, 1)',
    lineStagger: 40,
    middleDrop: '420ms cubic-bezier(0.2, 0, 0, 1)',
    bandExpand: '320ms cubic-bezier(0.2, 0, 0, 1)'
  }
};

export default function IntroSequence({ title, style = 'elegant' }: { title: string; style?: IntroStyle }) {
  const [stage, setStage] = useState<Stage | 'skip'>('skip');
  const timersRef = useRef<number[]>([]);
  const preset = PRESETS[style] ?? PRESETS.elegant;

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';

    if (reduceMotion || alreadySeen) {
      // Nothing of ours is about to render, so there's nothing to wait
      // for — reveal the real page immediately.
      document.documentElement.classList.remove('intro-veil');
      setStage('done');
      return undefined;
    }

    sessionStorage.setItem(SESSION_KEY, '1');
    setStage('title-in');

    // Hand off from the pre-hydration CSS veil (see Layout.astro) only
    // once our own full-screen stage has actually painted — removing it
    // in the same tick as setStage left a brief gap where the veil was
    // already gone but React's re-render hadn't painted yet, flashing a
    // sliver of the real page through before the stage caught up. Double
    // rAF reliably waits until after that next paint.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('intro-veil');
      });
    });

    timersRef.current = [
      window.setTimeout(() => setStage('title-out'), preset.titleOutAt),
      window.setTimeout(() => setStage('lines'), preset.linesAt),
      window.setTimeout(() => setStage('open-middle'), preset.openMiddleAt),
      window.setTimeout(() => setStage('expand'), preset.expandAt),
      window.setTimeout(() => setStage('done'), preset.doneAt)
    ];
    return () => timersRef.current.forEach((t) => window.clearTimeout(t));
  }, [preset]);

  if (stage === 'done' || stage === 'skip') return null;

  const drawn = stage === 'lines' || stage === 'open-middle' || stage === 'expand';
  const middleOpen = stage === 'open-middle' || stage === 'expand';
  const expanded = stage === 'expand';

  return (
    // Deliberately not interruptible by click or keypress — first-time
    // visitors watch the full sequence; only the once-per-session gate and
    // prefers-reduced-motion skip it entirely (see the mount effect above).
    <div className="fixed inset-0 z-[300]" aria-hidden="true">
      {/* Shared rotated stage, oversized so it always fully covers the
          viewport once tilted. Every piece of the "cut" — both solid bands
          and the two drawn lines — lives inside here, positioned with
          plain left/right offsets in this stage's own local space. Since
          they all share the exact same parent rotation, their edges always
          align perfectly (including mid-transition), instead of each piece
          rotating independently and drifting out of alignment with a
          straight-edged panel underneath it. */}
      <div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          width: '400vw',
          height: '400vh',
          transform: `translate(-50%, -50%) rotate(${LINE_ROTATION}deg)`
        }}
      >
        {/* Left band — its line is a child so it's carried along by the
            band's own translateX automatically; a percentage-based
            translateX on the line itself would resolve against the
            line's own 2px width, not the band's, and barely move it. */}
        <div
          className="absolute inset-y-0 left-0 bg-ink-950"
          style={{
            right: `calc(50% + ${LINE_OFFSET})`,
            transform: expanded ? 'translateX(-100%)' : 'translateX(0)',
            transition: `transform ${preset.bandExpand}`
          }}
        >
          <div
            className="absolute top-0 right-0 h-full w-0.5 bg-paper"
            style={{
              transformOrigin: 'center bottom',
              transform: `scaleY(${drawn ? 1 : 0})`,
              opacity: drawn ? 1 : 0,
              transition: `transform ${preset.lineDraw}, opacity ${preset.lineDraw}`
            }}
          />
        </div>
        {/* Middle band — drops away once the lines finish drawing,
            revealing the real page underneath as proof it's moving. */}
        <div
          className="absolute inset-y-0 bg-ink-950"
          style={{
            left: `calc(50% - ${LINE_OFFSET})`,
            width: `calc(${LINE_OFFSET} * 2)`,
            transform: `translateY(${middleOpen ? '115%' : '0%'})`,
            transition: `transform ${preset.middleDrop}`
          }}
        />
        {/* Right band — same reasoning, line nested so it travels with it */}
        <div
          className="absolute inset-y-0 right-0 bg-ink-950"
          style={{
            left: `calc(50% + ${LINE_OFFSET})`,
            transform: expanded ? 'translateX(100%)' : 'translateX(0)',
            transition: `transform ${preset.bandExpand}`
          }}
        >
          <div
            className="absolute top-0 left-0 h-full w-0.5 bg-paper"
            style={{
              transformOrigin: 'center top',
              transform: `scaleY(${drawn ? 1 : 0})`,
              opacity: drawn ? 1 : 0,
              transition: `transform ${preset.lineDraw} ${preset.lineStagger}ms, opacity ${preset.lineDraw} ${preset.lineStagger}ms`
            }}
          />
        </div>
      </div>

      <p
        className="absolute left-6 top-1/2 -translate-y-1/2 font-display text-4xl font-extrabold text-paper sm:left-14 sm:text-6xl"
        style={{
          opacity: stage === 'title-in' ? 1 : 0,
          transition: `opacity ${preset.titleFade}`
        }}
      >
        {title}
      </p>
    </div>
  );
}
