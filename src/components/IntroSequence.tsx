import { useEffect, useRef, useState } from 'react';

type Stage = 'title-in' | 'title-out' | 'lines' | 'open-middle' | 'expand' | 'done';

const SESSION_KEY = 'intro-seen';
const LINE_OFFSET = 'clamp(90px, 12vw, 220px)';
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
  // the intro is done, however it got there (played out, skipped, or interrupted).
  useEffect(() => {
    if (stage === 'done') {
      document.documentElement.classList.remove('intro-veil');
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'done' || stage === 'skip') return undefined;
    function skip() {
      // Without this, the mount effect's still-pending timers would keep
      // firing after a skip and bring the intro back a moment later.
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
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
      {/* Middle band, shaped to match the two lines (same rotation) — drops
          away along its own tilted axis once the lines finish drawing. */}
      <div
        className="absolute bg-ink-950 transition-transform duration-[650ms] ease-in"
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

      {/* Left line draws bottom-to-top, right line draws top-to-bottom */}
      <div
        className="intro-line"
        style={{
          height: '150vh',
          transformOrigin: 'center bottom',
          transform: `translate(calc(-1 * ${LINE_OFFSET}), -50%) rotate(${LINE_ROTATION}deg) scaleY(${drawn ? 1 : 0})`,
          opacity: expanded ? 0 : 1,
          transition: 'transform 500ms ease-out, opacity 300ms ease-out'
        }}
      />
      <div
        className="intro-line"
        style={{
          height: '150vh',
          transformOrigin: 'center top',
          transform: `translate(${LINE_OFFSET}, -50%) rotate(${LINE_ROTATION}deg) scaleY(${drawn ? 1 : 0})`,
          opacity: expanded ? 0 : 1,
          transition: 'transform 500ms ease-out 120ms, opacity 300ms ease-out'
        }}
      />
    </div>
  );
}
