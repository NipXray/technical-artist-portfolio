import { useEffect, useRef, useState } from 'react';

interface CaseStudySidebarProps {
  slug: string | null;
  onClose: () => void;
  // Which dynamic route this slug's full write-up lives on — projects and
  // professional entries each render their own page with a #case-study-content
  // element, and this panel just fetches that page and inlines it, so a
  // second content type only needs a different base path, not a new panel.
  basePath?: string;
}

const cache = new Map<string, string>();

export default function CaseStudySidebar({ slug, onClose, basePath = '/projects' }: CaseStudySidebarProps) {
  const [open, setOpen] = useState(false);
  const [displayedSlug, setDisplayedSlug] = useState<string | null>(null);
  const [html, setHtml] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (!slug) {
      setOpen(false);
      closeTimeout.current = window.setTimeout(() => setDisplayedSlug(null), 400);
      return;
    }

    if (closeTimeout.current) window.clearTimeout(closeTimeout.current);
    setDisplayedSlug(slug);
    requestAnimationFrame(() => setOpen(true));

    const cacheKey = `${basePath}:${slug}`;
    if (cache.has(cacheKey)) {
      setHtml(cache.get(cacheKey)!);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    fetch(`${basePath}/${slug}/`)
      .then((res) => res.text())
      .then((text) => {
        const doc = new DOMParser().parseFromString(text, 'text/html');
        const content = doc.getElementById('case-study-content');
        const extracted = content ? content.innerHTML : '<p>Could not load this case study.</p>';
        cache.set(cacheKey, extracted);
        setHtml(extracted);
        setStatus('idle');
        if (content?.querySelector('model-viewer')) {
          import('@google/model-viewer');
        }
      })
      .catch(() => setStatus('error'));
  }, [slug, basePath]);

  useEffect(() => {
    if (!displayedSlug) return undefined;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [displayedSlug, onClose]);

  if (!displayedSlug) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full case study"
      className={`fixed inset-y-0 right-0 z-[180] w-full transition-transform duration-500 ease-out md:w-[68%] lg:max-w-4xl ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ink-950/95 to-ink-950 md:via-ink-950/90" />

      {/* Pinned to this panel's own left edge, vertically centered, instead
          of the far top-right corner — that put it as far as possible from
          wherever the visitor actually clicked to open this panel, on the
          opposite edge from the still-visible page behind it. A solid pill
          background keeps it legible regardless of what's behind it here,
          since this edge sits on the gradient's transparent side. */}
      <button
        onClick={onClose}
        className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 rounded-none bg-ink-950/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-paper backdrop-blur-sm transition-colors hover:text-accent-2 sm:left-6"
      >
        <span aria-hidden="true">✕</span> Close
      </button>

      <div ref={scrollRef} className="relative h-full overflow-y-auto px-6 pb-16 pt-24 sm:px-14 sm:pt-28">
        {status === 'loading' && (
          <div className="flex h-64 items-center justify-center text-paper-dim">Loading case study…</div>
        )}
        {status === 'error' && (
          <div className="flex h-64 items-center justify-center text-paper-dim">
            Couldn't load this case study. Try again in a moment.
          </div>
        )}
        {status === 'idle' && <div dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  );
}
