// Shared by the History sidebar, the CV page, and Professional Project
// entries — all three use the same "YYYY" or "YYYY-MM" date convention.
export function formatDate(date: string) {
  const parts = date.split('-');
  const year = parts[0];
  if (parts.length === 1) return year;
  const month = new Date(`${date}-01T00:00:00`).toLocaleString('en-US', { month: 'short' });
  return `${month} ${year}`;
}

// Just the month name, no year — for entries grouped under a year heading
// that already supplies that context. Empty string for a year-only date.
export function formatMonth(date: string) {
  const parts = date.split('-');
  if (parts.length < 2) return '';
  return new Date(`${date}-01T00:00:00`).toLocaleString('en-US', { month: 'long' });
}

// Infers each item's "end" as the start of whichever item in the same list
// comes chronologically right after it — for a career timeline of
// sequential milestones with no separately-tracked end date, that's the
// only real source for one. The most recent item gets presentLabel
// instead. Keyed by object identity, so pass the same item references you'll
// render, not copies.
export function inferEndDates<T extends { date: string }>(items: T[], presentLabel: string): Map<T, string> {
  const ascending = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const map = new Map<T, string>();
  ascending.forEach((item, i) => {
    const next = ascending[i + 1];
    map.set(item, next ? formatDate(next.date) : presentLabel);
  });
  return map;
}

// A manually-entered End Date always wins over the guess above — there's no
// way to infer a real gap between roles, or an end date for the most recent
// one if it isn't actually still ongoing. "YYYY" or "YYYY-MM" gets the same
// formatting as every other date here; anything else (e.g. someone typing
// "Present" or "Ongoing" directly) is shown exactly as written.
export function resolveEndLabel(manualEndDate: string | undefined, inferredLabel: string | undefined) {
  if (!manualEndDate) return inferredLabel;
  return /^\d{4}(-\d{2})?$/.test(manualEndDate) ? formatDate(manualEndDate) : manualEndDate;
}
