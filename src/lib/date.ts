// Shared by the History sidebar, the CV page, and Professional Project
// entries — all three use the same "YYYY" or "YYYY-MM" date convention.
export function formatDate(date: string) {
  const parts = date.split('-');
  const year = parts[0];
  if (parts.length === 1) return year;
  const month = new Date(`${date}-01T00:00:00`).toLocaleString('en-US', { month: 'short' });
  return `${month} ${year}`;
}
