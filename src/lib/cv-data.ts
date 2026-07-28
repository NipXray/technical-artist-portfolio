import { formatDate } from './date';
import { CV_LABELS, type CvLang } from './cv-translations';

interface HistoryEntryData {
  date: string;
  title: string;
  titleId?: string;
  organization?: string;
  organizationId?: string;
  description: string;
  descriptionId?: string;
  tag?: string;
}

export interface CvItem {
  title: string;
  organization?: string;
  dateLabel: string;
  bullets: string[];
}

function toBullets(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

// "origin" entries are personal milestones meant for the on-site career
// timeline only — everything else (job/current/release) counts as real
// professional experience; "education" gets its own section.
const isExperience = (entry: HistoryEntryData) => entry.tag !== 'origin' && entry.tag !== 'education';
const isEducation = (entry: HistoryEntryData) => entry.tag === 'education';

export function buildCvSections(entries: HistoryEntryData[], lang: CvLang) {
  const t = CV_LABELS[lang];
  const pick = (en: string, translated?: string) => (lang === 'id' && translated ? translated : en);

  function toItem(entry: HistoryEntryData, dateLabel: string): CvItem {
    return {
      title: pick(entry.title, entry.titleId),
      organization: pick(entry.organization ?? '', entry.organizationId) || undefined,
      dateLabel,
      bullets: toBullets(pick(entry.description, entry.descriptionId))
    };
  }

  // Each role's end date is inferred as the start of the next (more recent)
  // entry — this is a career timeline of sequential milestones, not
  // independent jobs with their own tracked end dates, so there's no other
  // source for it. The most recent entry runs to "Present"/"Sekarang".
  const experienceAsc = entries.filter(isExperience).sort((a, b) => a.date.localeCompare(b.date));
  const experience = experienceAsc
    .map((entry, i) => {
      const next = experienceAsc[i + 1];
      const end = next ? formatDate(next.date) : t.present;
      return toItem(entry, `${formatDate(entry.date)} – ${end}`);
    })
    .reverse();

  const education = entries
    .filter(isEducation)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => toItem(entry, `${t.graduated} ${entry.date.slice(0, 4)}`));

  return { experience, education };
}
