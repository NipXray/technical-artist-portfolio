import { useEffect, useRef, useState } from 'react';

type Stage = 'title-in' | 'title-out' | 'lines' | 'open-middle' | 'expand' | 'done';

const SESSION_KEY = 'intro-seen';
// Distance from center to each line — scales with viewport width so the
// gap reads as similarly proportioned on a small laptop and a large desktop
// monitor, instead of hitting a low fixed cap on bigger screens.
const LINE_OFFSET = 'clamp(110px, 15vw, 400px)';
const LINE_ROTATION = 18;

export default function IntroSequence({ title }: { title: string }) {
  const [stage, setStage] = useState<Stage | 'skip'>('skip');
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';

    // Hand off from the pre-hydration CSS veil (see Layout.astro) the
    // moment this component takes over — either it renders nothing (skip
    // case) or its own full-screen panels (real sequence), so the veil's
    // job is already done here. Leaving it until stage==='done' meant it
    // sat as a second, un-animated black layer directly behind the panels
    // for the entire reveal — they'd genuinely slide away, but all that
    // was ever revealed underneath was the still-present veil, not the
    // real page, making the whole sequence look like nothing moved.
    document.documentElement.classList.remove('intro-veil');

    if (reduceMotion || alreadySeen) {
      setStage('done');
      return undefined;
    }

    sessionStorage.setItem(SESSION_KEY, '1');
    setStage('title-in');

    timersRef.current = [
      window.setTimeout(() => setStage('title-out'), 1100),
      window.setTimeout(() => setStage('lines'), 1650),
      window.setTimeout(() => setStage('open-middle'), 2450),
      // The middle panel's own drop (1000ms) finishes at 3450, then holds
      // fully open for 600ms before 'expand' starts — a deliberate pause so
      // it reads as its own distinct beat instead of blurring straight into
      // the left/right slide that follows.
      window.setTimeout(() => setStage('expand'), 4050),
      window.setTimeout(() => setStage('done'), 4900)
    ];
    return () => timersRef.current.forEach((t) => window.clearTimeout(t));
  }, []);

  if (stage === 'done' || stage === 'skip') return null;

  const drawn = stage === 'lines' || stage === 'open-middle' || stage === 'expand';
  const middleOpen = stage === 'open-middle' || stage === 'expand';
  const expanded = stage === 'expand';

  return (
    // Deliberately not interruptible by click or keypress — first-time
    // visitors watch the full sequence; only the once-per-session gate and
    // prefers-reduced-motion skip it entirely (see the mount effect above).
    <div className="fixed inset-0 z-[300]" aria-hidden="true">
      {/* Left curtain panel */}
      <div
        className="absolute inset-y-0 left-0 bg-ink-950 transition-transform duration-700 ease-in-out"
        style={{
          width: `calc(50% - ${LINE_OFFSET})`,
          transform: expanded ? 'translateX(-100%)' : 'translateX(0)'
        }}
      />
      {/* Right curtain panel */}
      <div
        className="absolute inset-y-0 right-0 bg-ink-950 transition-transform duration-700 ease-in-out"
        style={{
          width: `calc(50% - ${LINE_OFFSET})`,
          transform: expanded ? 'translateX(100%)' : 'translateX(0)'
        }}
      />
      {/* Middle band, shaped to match the two lines (same rotation) — a
          plain solid panel that drops away along its own tilted axis once
          the lines finish drawing, revealing the real page underneath (not
          a colored accent) as proof it's moving. */}
      <div
        className="absolute bg-ink-950 transition-transform duration-[1000ms] ease-in"
        style={{
          top: '50%',
          left: '50%',
          width: `calc(${LINE_OFFSET} * 2)`,
          height: '160vh',
          transform: `translate(-50%, -50%) rotate(${LINE_ROTATION}deg) translateY(${middleOpen ? '115%' : '0%'})`
        }}
      />

      <p
        className={`absolute left-6 top-1/2 -translate-y-1/2 font-display text-4xl font-extrabold text-paper transition-opacity duration-500 sm:left-14 sm:text-6xl ${
          stage === 'title-in' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {title}
      </p>

      {/* Left line draws bottom-to-top, right line draws top-to-bottom, then
          each travels off screen with its own panel during 'expand' so the
          motion stays visible instead of just vanishing in place. */}
      <div
        className="intro-line"
        style={{
          height: '150vh',
          transformOrigin: 'center bottom',
          transform: `translateX(${expanded ? '-100vw' : '0px'}) translate(calc(-1 * ${LINE_OFFSET}), -50%) rotate(${LINE_ROTATION}deg) scaleY(${drawn ? 1 : 0})`,
          transition: 'transform 600ms ease-in-out'
        }}
      />
      <div
        className="intro-line"
        style={{
          height: '150vh',
          transformOrigin: 'center top',
          transform: `translateX(${expanded ? '100vw' : '0px'}) translate(${LINE_OFFSET}, -50%) rotate(${LINE_ROTATION}deg) scaleY(${drawn ? 1 : 0})`,
          transition: 'transform 600ms ease-in-out 100ms'
        }}
      />
    </div>
  );
}
