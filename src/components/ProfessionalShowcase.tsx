import { useState } from 'react';
import { formatDate } from '../lib/date';
import CaseStudySidebar from './CaseStudySidebar';

export interface ProfessionalEntry {
  slug: string;
  title: string;
  cover: string;
  role: string;
  date: string;
  company?: string;
}

export default function ProfessionalShowcase({ entries }: { entries: ProfessionalEntry[] }) {
  const [caseStudySlug, setCaseStudySlug] = useState<string | null>(null);

  return (
    <>
      {/* Column-fill masonry: fills the left column top-to-bottom before
          starting the next one, instead of a row-first grid — matches how
          this section's cards are meant to read as a stacked set of credits
          rather than a uniform tile grid. */}
      <div className="columns-1 gap-0.5 sm:columns-2">
        {entries.map((entry) => (
          <button
            key={entry.slug}
            onClick={() => setCaseStudySlug(entry.slug)}
            // Fixed wide/short aspect ratio (~4:1) instead of the cover
            // image's own proportions — keeps every card the same shape so
            // the column-fill grid reads as one continuous, gapless wall
            // rather than a loose masonry of varying tile heights.
            className="group relative mb-0.5 block aspect-[4/1] w-full break-inside-avoid overflow-hidden border-0 bg-transparent p-0 text-left"
          >
            <img
              src={entry.cover}
              alt={entry.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <h3 className="font-display text-base font-bold text-paper drop-shadow sm:text-lg">{entry.title}</h3>
              <p className="mt-0.5 text-xs text-paper-dim sm:text-sm">
                {entry.role} &middot; {formatDate(entry.date)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <CaseStudySidebar slug={caseStudySlug} onClose={() => setCaseStudySlug(null)} basePath="/professional" />
    </>
  );
}
