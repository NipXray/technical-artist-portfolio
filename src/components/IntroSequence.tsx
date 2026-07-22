import { useEffect, useState } from 'react';

type Stage = 'title-in' | 'title-out' | 'lines' | 'open-middle' | 'expand' | 'done';

const SESSION_KEY = 'intro-seen';
const LINE_OFFSET = 'clamp(90px, 12vw, 220px)';

export default function IntroSequence({ title }: { title: string }) {
  const [stage, setStage] = useState<Stage | 'skip'>('skip');

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';

    if (reduceMotion || alreadySeen) {
      setStage('done');
      return;
    }

    sessionStorage.setItem(SESSION_KEY, '1');
    setStage('title-in');

    const timers = [
      window.setTimeout(() => setStage('title-out'), 1100),
      window.setTimeout(() => setStage('lines'), 1650),
      window.setTimeout(() => setStage('open-middle'), 2450),
      window.setTimeout(() => setStage('expand'), 2950),
      window.setTimeout(() => setStage('done'), 3700)
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  // Hand off from the pre-hydration CSS veil (see Layout.astro) the moment
  // the intro is done, however it got there (played out, skipped, or interrupted).
  useEffect(() => {
    if (stage === 'done') {
      document.documentElement.classList.remove('intro-veil');
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'done' || stage === 'skip') return undefined;
    function skip() {
      setStage('done');
    }
    window.addEventListener('keydown', skip);
    window.addEventListener('click', skip);
    return () => {
      window.removeEventListener('keydown', skip);
      window.removeEventListener('click', skip);
    };
  }, [stage]);

  if (stage === 'done' || stage === 'skip') return null;

  const drawn = stage === 'lines' || stage === 'open-middle' || stage === 'expand';
  const middleOpen = stage === 'open-middle' || stage === 'expand';
  const expanded = stage === 'expand';

  return (
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
      {/* Middle band between the two lines — clears first */}
      <div
        className="absolute inset-y-0 bg-ink-950 transition-opacity duration-300 ease-out"
        style={{
          left: `calc(50% - ${LINE_OFFSET})`,
          width: `calc(${LINE_OFFSET} * 2)`,
          opacity: middleOpen ? 0 : 1
        }}
      />

      <p
        className={`absolute left-6 top-1/2 -translate-y-1/2 font-display text-4xl font-extrabold text-paper transition-opacity duration-500 sm:left-14 sm:text-6xl ${
          stage === 'title-in' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {title}
      </p>

      <div
        className="intro-line"
        style={{
          height: '150vh',
          transform: `translate(calc(-1 * ${LINE_OFFSET}), -50%) rotate(18deg) scaleY(${drawn ? 1 : 0})`,
          opacity: expanded ? 0 : 1,
          transition: 'transform 500ms ease-out, opacity 300ms ease-out'
        }}
      />
      <div
        className="intro-line"
        style={{
          height: '150vh',
          transform: `translate(${LINE_OFFSET}, -50%) rotate(18deg) scaleY(${drawn ? 1 : 0})`,
          opacity: expanded ? 0 : 1,
          transition: 'transform 500ms ease-out 120ms, opacity 300ms ease-out'
        }}
      />
    </div>
  );
}
