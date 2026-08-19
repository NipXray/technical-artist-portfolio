import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, formatMonth, inferEndDates, resolveEndLabel } from '../lib/date';
import { isExperienceTag } from '../lib/history-tags';

export interface HistoryEntry {
  date: string;
  title: string;
  description: string;
  tag?: string;
  endDate?: string;
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

  // Entries are already date-sorted, so grouping them by year here just
  // makes that structure visible — every entry for a year stays together
  // as that year's "children" before the next year's group starts, and
  // since the wheel stepper below advances through the flat entries array
  // in this same order, it naturally can't leave a year until every month
  // in it has been stepped through.
  const yearGroups = useMemo(() => {
    const map = new Map<string, { entry: HistoryEntry; index: number }[]>();
    entries.forEach((entry, index) => {
      const year = entry.date.split('-')[0];
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push({ entry, index });
    });
    return [...map.entries()];
  }, [entries]);

  // Duration-bearing entries (real roles, not one-off milestones) get a
  // "start – end" range instead of just a start month, same as the CV.
  const rangeEnds = useMemo(
    () => inferEndDates(entries.filter((entry) => isExperienceTag(entry.tag)), 'Present'),
    [entries]
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const autoscroll = useRef<{ originY: number; speed: number } | null>(null);
  const autoscrollFrame = useRef<number | null>(null);
  const [autoscrollIndicator, setAutoscrollIndicator] = useState<{ x: number; y: number } | null>(null);
  // Set while a wheel-triggered smooth scroll-into-view is still animating,
  // so the position-based observer below doesn't fight it mid-transition —
  // several entries can briefly cross its trigger zone while easing toward
  // the one the wheel stepper already decided on.
  const programmaticScroll = useRef(false);

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

  // Advances/retreats the active entry by exactly one step per accumulated
  // chunk of wheel movement, instead of mapping raw scroll position 1:1 to
  // which entry is "nearest the top" — that let a fast flick skip straight
  // past several entries with no chance to read them. Wheel input is
  // intercepted (preventDefault) so the panel never actually races ahead of
  // the step logic; the entry list itself stays compact (so the whole
  // timeline, first year to latest, is still visible at a glance) and the
  // active entry is instead brought into view explicitly below.
  useEffect(() => {
    if (!open) return undefined;
    const root = scrollRef.current;
    if (!root) return undefined;

    let accumulated = 0;
    const STEP_THRESHOLD = 180;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      accumulated += e.deltaY;
      if (accumulated >= STEP_THRESHOLD) {
        accumulated = 0;
        setActiveIndex((i) => Math.min(i + 1, entries.length - 1));
      } else if (accumulated <= -STEP_THRESHOLD) {
        accumulated = 0;
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
    }

    root.addEventListener('wheel', handleWheel, { passive: false });
    return () => root.removeEventListener('wheel', handleWheel);
  }, [open, entries.length]);

  // Touch/trackpad drag and the middle-click autoscroll below still move
  // scrollTop directly rather than going through the wheel stepper, so this
  // keeps the active entry (and the year marker, which just reads off it)
  // in sync with wherever a non-wheel scroll actually lands.
  useEffect(() => {
    if (!open) return undefined;
    const root = scrollRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (observedEntries) => {
        if (programmaticScroll.current) return;
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

    function handleScroll() {
      if (!root || programmaticScroll.current) return;
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

  // Brings whichever entry is now active into view, so the visible scroll
  // position follows the active index instead of the other way around.
  // For a touch/autoscroll-driven change the panel's already roughly there,
  // so this just settles it; for a wheel-driven step the flag it sets stops
  // the observer above from fighting the animation while it's in flight.
  useEffect(() => {
    if (!open) return undefined;
    programmaticScroll.current = true;
    itemRefs.current.get(activeIndex)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = window.setTimeout(() => {
      programmaticScroll.current = false;
    }, 500);
    return () => window.clearTimeout(t);
  }, [activeIndex, open]);

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

          {/* Year is the parent, months are its children, and only the
              active year's children are actually shown — collapsed years
              display as just their number until the wheel stepper (which
              still just advances through the flat entries array) reaches
              an entry that belongs to them. */}
          <div className="relative">
            {yearGroups.map(([year, group]) => {
              const isActiveYear = group.some(({ index }) => index === activeIndex);
              return (
                <div key={year} className="mb-4 last:mb-0">
                  <button
                    type="button"
                    // Jumps to this year's first entry — same effect as
                    // scrolling into it, just immediate. If the year's
                    // already active, this is a no-op rather than jumping
                    // backward to its first month.
                    onClick={() => setActiveIndex((i) => (isActiveYear ? i : group[0].index))}
                    className={`block w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-left font-display text-2xl font-extrabold transition-colors duration-300 ${
                      isActiveYear ? 'text-paper' : 'text-paper-dim/50 hover:text-paper-dim'
                    }`}
                  >
                    {year}
                  </button>
                  <div
                    className={`grid overflow-hidden transition-[grid-template-rows] duration-500 ease-out ${
                      isActiveYear ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                  <ol className="relative mt-3 min-h-0 overflow-hidden border-l border-border pl-6">
                    {group.map(({ entry, index }) => (
                      <li
                        key={`${entry.date}-${index}`}
                        data-index={index}
                        ref={(el) => {
                          if (el) itemRefs.current.set(index, el);
                        }}
                        // Kept compact rather than padded out with reserved
                        // empty space — the whole timeline (first year to
                        // latest) stays visible together this way. Reading
                        // pace is handled by the wheel stepper above instead
                        // of by making each entry take a fixed scroll
                        // distance to get through.
                        className="mb-6 select-none last:mb-0"
                      >
                        <span
                          className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-none border-2 border-ink-900 ${
                            TAG_COLORS[entry.tag ?? ''] ?? 'bg-accent'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setActiveIndex(index)}
                          className="block w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-left"
                        >
                          <p className="text-xs font-bold uppercase tracking-wide text-accent-2">
                            {rangeEnds.has(entry)
                              ? `${formatDate(entry.date)} – ${resolveEndLabel(entry.endDate, rangeEnds.get(entry))}`
                              : formatMonth(entry.date) || formatDate(entry.date)}
                          </p>
                          <h3
                            className={`mt-1 font-display font-semibold transition-colors duration-300 ${
                              index === activeIndex ? 'text-paper' : 'text-paper-dim'
                            }`}
                          >
                            {entry.title}
                          </h3>
                        </button>
                        {/* grid-template-rows 0fr->1fr is what makes this transition to
                            the description's real (auto) height instead of a guessed
                            max-height — only the entry nearest the top of the scroll
                            area is open, so scrolling down closes this one and opens
                            whichever entry it reaches next. */}
                        <div
                          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                            index === activeIndex ? 'mt-1 grid-rows-[1fr]' : 'grid-rows-[0fr]'
                          }`}
                        >
                          <p className="min-h-0 overflow-hidden text-sm text-paper-dim">{entry.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  </div>
                </div>
              );
            })}
          </div>
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
