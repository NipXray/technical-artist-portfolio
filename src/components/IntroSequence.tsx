import { useEffect, useRef, useState } from 'react';

export type IntroStyle = 'elegant' | 'fast';

const SESSION_KEY = 'intro-seen';
// Distance from center to each line — scales with viewport width so the
// gap reads as similarly proportioned on a small laptop and a large desktop
// monitor, instead of hitting a low fixed cap on bigger screens.
const LINE_OFFSET = 'clamp(110px, 15vw, 400px)';
const LINE_ROTATION = 18;
// The lines are 2px wide but need real height to comfortably cross the
// screen once rotated — 150vh is enough for that without going anywhere
// near the size that triggered a rasterization glitch (see below).
const LINE_LENGTH = '150vh';

interface Preset {
  titleOutAt: number;
  linesAt: number;
  middleAt: number;
  expandAt: number;
  finishAt: number;
  titleFade: string;
  lineDraw: string;
  lineStagger: number;
  middleDrop: string;
  bandExpand: string;
}

// "elegant" plays each phase sequentially — the next one only starts once
// the previous has essentially finished. "fast" deliberately overlaps the
// tail of each phase with the start of the next, for a snappier, more
// continuous feel at that quicker pace.
const PRESETS: Record<IntroStyle, Preset> = {
  elegant: {
    titleOutAt: 2000,
    linesAt: 3000,
    middleAt: 4600,
    expandAt: 7200,
    finishAt: 8800,
    // A gentler, more symmetric ease than a fast-start/long-tail curve —
    // the earlier curve still had an abrupt initial snap even at longer
    // durations, which read as quick rather than smooth.
    titleFade: '1000ms cubic-bezier(0.45, 0, 0.15, 1)',
    lineDraw: '1600ms cubic-bezier(0.45, 0, 0.15, 1)',
    lineStagger: 150,
    middleDrop: '2000ms cubic-bezier(0.45, 0, 0.15, 1)',
    bandExpand: '1400ms cubic-bezier(0.45, 0, 0.15, 1)'
  },
  fast: {
    titleOutAt: 550,
    linesAt: 700,
    middleAt: 950,
    expandAt: 1330,
    finishAt: 1900,
    titleFade: '250ms cubic-bezier(0.4, 0, 1, 1)',
    lineDraw: '380ms cubic-bezier(0.2, 0, 0, 1)',
    lineStagger: 40,
    middleDrop: '450ms cubic-bezier(0.2, 0, 0, 1)',
    bandExpand: '380ms cubic-bezier(0.2, 0, 0, 1)'
  }
};

export default function IntroSequence({ title, style = 'elegant' }: { title: string; style?: IntroStyle }) {
  const [active, setActive] = useState(false); // the real sequence is running
  const [visible, setVisible] = useState(false); // title fade-IN trigger (see mount effect)
  const [titleOut, setTitleOut] = useState(false);
  const [linesDrawn, setLinesDrawn] = useState(false);
  const [middleOpen, setMiddleOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [finished, setFinished] = useState(false);
  const timersRef = useRef<number[]>([]);
  const preset = PRESETS[style] ?? PRESETS.elegant;

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';

    if (reduceMotion || alreadySeen) {
      // Nothing of ours is about to render, so there's nothing to wait
      // for — reveal the real page immediately.
      document.documentElement.classList.remove('intro-veil');
      setFinished(true);
      return undefined;
    }

    sessionStorage.setItem(SESSION_KEY, '1');
    setActive(true);

    // Hand off from the pre-hydration CSS veil (see Layout.astro) only
    // once our own full-screen stage has actually painted, then flip the
    // title to visible on the FOLLOWING frame — a freshly-mounted element
    // can't transition from a state it never had, so setting opacity:1 on
    // the very first render just pops it in with no fade at all. Waiting
    // one more frame to flip it gives the browser an actual "0 -> 1"
    // change to animate.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('intro-veil');
        setVisible(true);
      });
    });

    timersRef.current = [
      window.setTimeout(() => setTitleOut(true), preset.titleOutAt),
      window.setTimeout(() => setLinesDrawn(true), preset.linesAt),
      window.setTimeout(() => setMiddleOpen(true), preset.middleAt),
      window.setTimeout(() => setExpanded(true), preset.expandAt),
      window.setTimeout(() => setFinished(true), preset.finishAt)
    ];
    return () => timersRef.current.forEach((t) => window.clearTimeout(t));
  }, [preset]);

  if (finished || !active) return null;

  const glow = style === 'elegant' ? '0 0 14px 1px rgba(246, 241, 238, 0.45)' : 'none';
  const titleShown = visible && !titleOut;

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
          {/* Fixed, modest height instead of inheriting the parent's 400vh
              — at that extreme a height, still nested in an already-
              rotated ancestor, a 2px-wide line rasterized as disconnected
              fragments instead of one continuous stroke. */}
          <div
            className="absolute right-0 w-0.5 bg-paper"
            style={{
              top: '50%',
              height: LINE_LENGTH,
              boxShadow: glow,
              transformOrigin: 'center bottom',
              transform: `translateY(-50%) scaleY(${linesDrawn ? 1 : 0})`,
              opacity: linesDrawn ? 1 : 0,
              transition: `transform ${preset.lineDraw}, opacity ${preset.lineDraw}`
            }}
          />
        </div>
        {/* Middle band — drops away once the lines are mostly drawn,
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
            className="absolute left-0 w-0.5 bg-paper"
            style={{
              top: '50%',
              height: LINE_LENGTH,
              boxShadow: glow,
              transformOrigin: 'center top',
              transform: `translateY(-50%) scaleY(${linesDrawn ? 1 : 0})`,
              opacity: linesDrawn ? 1 : 0,
              transition: `transform ${preset.lineDraw} ${preset.lineStagger}ms, opacity ${preset.lineDraw} ${preset.lineStagger}ms`
            }}
          />
        </div>
      </div>

      <p
        className="absolute left-6 top-1/2 font-display text-4xl font-extrabold text-paper sm:left-14 sm:text-6xl"
        style={{
          opacity: titleShown ? 1 : 0,
          transform: `translateY(calc(-50% + ${titleShown ? '0px' : '14px'}))`,
          transition: `opacity ${preset.titleFade}, transform ${preset.titleFade}`
        }}
      >
        {title}
      </p>
    </div>
  );
}
