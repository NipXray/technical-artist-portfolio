import { useEffect, useRef, useState } from 'react';

export interface HistoryEntry {
  date: string;
  title: string;
  description: string;
  tag?: string;
}

const TAG_COLORS: Record<string, string> = {
  origin: 'bg-paper-dim',
  education: 'bg-accent-2',
  job: 'bg-accent',
  release: 'bg-accent',
  current: 'bg-accent-2'
};

function formatDate(date: string) {
  const parts = date.split('-');
  const year = parts[0];
  if (parts.length === 1) return year;
  const month = new Date(`${date}-01T00:00:00`).toLocaleString('en-US', { month: 'short' });
  return `${month} ${year}`;
}

export default function HistorySidebar({ entries }: { entries: HistoryEntry[] }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
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
        className={`fixed inset-y-0 right-0 z-[95] flex w-full max-w-md flex-col border-l border-border bg-ink-900 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="font-mono text-xs text-accent">// history.log</p>
            <h2 className="mt-1 text-xl font-bold text-paper">Career Timeline</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close history"
            className="rounded-lg border border-border px-2.5 py-1.5 font-mono text-sm text-paper-dim transition-colors hover:border-accent hover:text-accent"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ol className="relative border-l border-border pl-6">
            {entries.map((entry, i) => (
              <li key={`${entry.date}-${i}`} className="mb-8 last:mb-0">
                <span
                  className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-ink-900 ${
                    TAG_COLORS[entry.tag ?? ''] ?? 'bg-accent'
                  }`}
                />
                <p className="font-mono text-xs text-accent-2">{formatDate(entry.date)}</p>
                <h3 className="mt-1 font-semibold text-paper">{entry.title}</h3>
                <p className="mt-1 text-sm text-paper-dim">{entry.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
