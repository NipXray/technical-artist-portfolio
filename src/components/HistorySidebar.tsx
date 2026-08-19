import { useEffect, useRef, useState } from 'react';
import { formatDate } from '../lib/date';

export interface HistoryEntry {
  date: string;
  title: string;
  description: string;
  tag?: string;
}

const TAG_COLORS: Record<string, string> = {
  origin: 'bg-paper-dim',
  education: 'bg-accent-3',
  job: 'bg-accent',
  release: 'bg-accent',
  current: 'bg-accent-2',
  highlight: 'bg-paper-dim'
};

export default function HistorySidebar({ entries }: { entries: HistoryEntry[] }) {
  const [open, setOpen] = useState(false);
  // Which entry's description is expanded — driven entirely by scroll
  // position (whichever entry sits nearest the top), not clicks: scrolling
  // down closes the current entry and opens the next one it reaches, and
  // the big year marker above just reads off this same active entry.
  const [activeIndex, setActiveIndex] = useState(0);
  const currentYear = entries[activeIndex]?.date.split('-')[0] ?? entries[0]?.date.split('-')[0] ?? '';
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const autoscroll = useRef<{ originY: number; speed: number } | null>(null);
  const autoscrollFrame = useRef<number | null>(null);
  const [autoscrollIndicator, setAutoscrollIndicator] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const trigger = document.getElementById('history-trigger');
    const openSidebar = () => setOpen(true);
    trigger?.addEventListener('click', openSidebar);
    return () => trigger?.removeEventListener('click', openSidebar);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(e: MouseEvent) {
      const trigger = document.getElementById('history-trigger');
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (trigger?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    // global.css sets an explicit overflow-x on <html>, which stops browsers
    // from propagating <body>'s own overflow to the viewport's scrolling
    // box the way they normally would — locking body alone left the page
    // still scrollable out from under the panel. Lock both.
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  // Drives both the accordion (which entry is expanded) and the sticky
  // year marker off the same signal: whichever entry currently sits
  // nearest the top of the scroll area.
  useEffect(() => {
    if (!open) return undefined;
    const root = scrollRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (observedEntries) => {
        const visible = observedEntries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        const index = Number(topMost.target.getAttribute('data-index'));
        if (!Number.isNaN(index) && entries[index]) {
          setActiveIndex(index);
        }
      },
      { root, rootMargin: '0px 0px -65% 0px', threshold: 0 }
    );

    itemRefs.current.forEach((el) => observer.observe(el));

    // The IntersectionObserver's trigger zone sits near the top of the panel,
    // so the last entry can never scroll far enough to reach it before hitting
    // the bottom of the scroll range. Force it active once fully scrolled.
    function handleScroll() {
      if (!root) return;
      const atBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 4;
      if (atBottom && entries.length > 0) {
        setActiveIndex(entries.length - 1);
      }
    }
    root.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      root.removeEventListener('scroll', handleScroll);
    };
  }, [open, entries]);

  // Middle-click autoscroll: click the middle mouse button once to arm it,
  // then move the mouse up/down (no need to hold anything) to scroll
  // continuously — the further from the click point, the faster it scrolls.
  // Click again (any button) or press Escape to stop.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !open) return undefined;

    function stop() {
      autoscroll.current = null;
      setAutoscrollIndicator(null);
      if (autoscrollFrame.current !== null) {
        cancelAnimationFrame(autoscrollFrame.current);
        autoscrollFrame.current = null;
      }
    }

    function tick() {
      if (!autoscroll.current || !root) return;
      root.scrollTop += autoscroll.current.speed;
      autoscrollFrame.current = requestAnimationFrame(tick);
    }

    function handleMiddleClick(e: MouseEvent) {
      if (e.button !== 1) return;
      e.preventDefault();
      if (autoscroll.current) {
        stop();
        return;
      }
      const rect = panelRef.current?.getBoundingClientRect();
      autoscroll.current = { originY: e.clientY, speed: 0 };
      setAutoscrollIndicator({ x: rect ? rect.left + rect.width / 2 : e.clientX, y: e.clientY });
      autoscrollFrame.current = requestAnimationFrame(tick);
    }

    function handleOtherClick(e: MouseEvent) {
      if (e.button !== 1 && autoscroll.current) stop();
    }

    function handleMouseMove(e: MouseEvent) {
      if (!autoscroll.current) return;
      const delta = e.clientY - autoscroll.current.originY;
      const deadZone = 10;
      const magnitude = Math.max(0, Math.abs(delta) - deadZone);
      autoscroll.current.speed = Math.sign(delta) * Math.min(magnitude * 0.18, 26);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && autoscroll.current) stop();
    }

    root.addEventListener('mousedown', handleMiddleClick);
    window.addEventListener('mousedown', handleOtherClick);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      root.removeEventListener('mousedown', handleMiddleClick);
      window.removeEventListener('mousedown', handleOtherClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      stop();
    };
  }, [open]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[90] bg-ink-950/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Career history"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[95] flex w-full max-w-md flex-col bg-ink-900 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent-2">My Journey</p>
            <h2 className="mt-1 font-display text-xl font-bold text-paper">Career Timeline</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close history"
            className="rounded-none bg-ink-800 px-3 py-1.5 text-sm text-paper-dim transition-colors hover:text-accent-2"
          >
            ✕
          </button>
        </div>

        <div
          ref={scrollRef}
          className={`themed-scrollbar relative flex-1 overflow-y-auto px-6 pb-6 ${
            autoscrollIndicator ? 'cursor-ns-resize' : ''
          }`}
        >
          <div className="pointer-events-none sticky top-0 z-10 -mx-6 mb-2 bg-gradient-to-b from-ink-900 from-70% to-transparent px-6 pb-8 pt-6">
            <span className="font-display text-5xl font-extrabold text-accent/25">{currentYear}</span>
          </div>

          <ol className="relative border-l border-border pl-6">
            {entries.map((entry, i) => (
              <li
                key={`${entry.date}-${i}`}
                data-index={i}
                ref={(el) => {
                  if (el) itemRefs.current.set(i, el);
                }}
                // A reserved minimum height per entry, not just its own
                // content — collapsed entries are short enough to fit most
                // panel heights with room to spare, which would leave
                // nothing to scroll and the accordion would never advance.
                // Sized off the viewport (not a fixed px value) so each
                // entry takes a deliberate, substantial scroll distance to
                // pass through regardless of window size — the earlier
                // fixed 220px let a couple of wheel notches blow straight
                // through several entries before there was time to read one.
                className="mb-8 min-h-[45vh] select-none last:mb-0"
              >
                <span
                  className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-none border-2 border-ink-900 ${
                    TAG_COLORS[entry.tag ?? ''] ?? 'bg-accent'
                  }`}
                />
                <p className="text-xs font-bold uppercase tracking-wide text-accent-2">{formatDate(entry.date)}</p>
                <h3
                  className={`mt-1 font-display font-semibold transition-colors duration-300 ${
                    i === activeIndex ? 'text-paper' : 'text-paper-dim'
                  }`}
                >
                  {entry.title}
                </h3>
                {/* grid-template-rows 0fr->1fr is what makes this transition to
                    the description's real (auto) height instead of a guessed
                    max-height — only the entry nearest the top of the scroll
                    area is open, so scrolling down closes this one and opens
                    whichever entry it reaches next. */}
                <div
                  className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                    i === activeIndex ? 'mt-1 grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <p className="min-h-0 overflow-hidden text-sm text-paper-dim">{entry.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {autoscrollIndicator && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-none border border-accent/60 bg-ink-950/80 text-accent shadow-lg"
          style={{ left: autoscrollIndicator.x, top: autoscrollIndicator.y }}
        >
          <span className="text-sm leading-none">↕</span>
        </div>
      )}
    </>
  );
}
