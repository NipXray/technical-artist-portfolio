import { formatDate, inferEndDates, resolveEndLabel } from './date';
import { isEducationTag, isExperienceTag } from './history-tags';
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
  endDate?: string;
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

  const experienceEntries = entries.filter((entry) => isExperienceTag(entry.tag));
  const inferredEnds = inferEndDates(experienceEntries, t.present);
  const experience = [...experienceEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => {
      const end = resolveEndLabel(entry.endDate, inferredEnds.get(entry));
      return toItem(entry, `${formatDate(entry.date)} – ${end}`);
    });

  const education = entries
    .filter((entry) => isEducationTag(entry.tag))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => toItem(entry, `${t.graduated} ${entry.date.slice(0, 4)}`));

  return { experience, education };
}
