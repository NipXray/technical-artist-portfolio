import { useEffect, useState } from 'react';

type Stage = 'title-in' | 'title-out' | 'lines' | 'wipe' | 'done';

const SESSION_KEY = 'intro-seen';

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
      window.setTimeout(() => setStage('wipe'), 2450),
      window.setTimeout(() => setStage('done'), 3300)
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

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

  const wiping = stage === 'wipe';

  return (
    <div
      className="fixed inset-0 z-[300] bg-ink-950 transition-[clip-path] duration-[900ms] ease-in-out"
      style={{ clipPath: wiping ? 'inset(100% 0 0 0)' : 'inset(0 0 0 0)' }}
      aria-hidden="true"
    >
      <p
        className={`absolute left-6 top-1/2 -translate-y-1/2 font-display text-4xl font-extrabold text-paper transition-opacity duration-500 sm:left-14 sm:text-6xl ${
          stage === 'title-in' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {title}
      </p>

      {(() => {
        const drawn = stage === 'lines' || stage === 'wipe';
        return (
          <>
            <div
              className="intro-line"
              style={{
                height: '150vh',
                transform: `translate(-70px, -50%) rotate(18deg) scaleY(${drawn ? 1 : 0})`,
                transition: 'transform 500ms ease-out'
              }}
            />
            <div
              className="intro-line"
              style={{
                height: '150vh',
                transform: `translate(70px, -50%) rotate(18deg) scaleY(${drawn ? 1 : 0})`,
                transition: 'transform 500ms ease-out 120ms'
              }}
            />
          </>
        );
      })()}
    </div>
  );
}
