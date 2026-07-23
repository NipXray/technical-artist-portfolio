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
      window.setTimeout(() => setStage('expand'), 3200),
      window.setTimeout(() => setStage('done'), 4100)
    ];
    return () => timersRef.current.forEach((t) => window.clearTimeout(t));
  }, []);

  // Hand off from the pre-hydration CSS veil (see Layout.astro) the moment
  // the intro is done, however it got there (played out, or gated by
  // session/reduced-motion below).
  useEffect(() => {
    if (stage === 'done') {
      document.documentElement.classList.remove('intro-veil');
    }
  }, [stage]);

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
      {/* Middle band, shaped to match the two lines (same rotation) — drops
          away along its own tilted axis once the lines finish drawing. A
          bright band near its (screen-facing) top edge sweeps down through
          the viewport as it travels, so the motion reads clearly even
          against a dark hero background. */}
      <div
        className="absolute transition-transform duration-[750ms] ease-in"
        style={{
          top: '50%',
          left: '50%',
          width: `calc(${LINE_OFFSET} * 2)`,
          height: '160vh',
          // A plain hardcoded color here, not color-mix() — that function
          // is unsupported on some real-world browsers/versions, and an
          // invalid value silently drops the whole gradient, leaving this
          // panel with no visible background at all during its animation.
          background:
            'linear-gradient(to bottom, var(--color-ink-950) 0%, rgb(249, 219, 174) 6%, var(--color-ink-950) 14%, var(--color-ink-950) 100%)',
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
