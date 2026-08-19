// "origin" (personal milestones) and "highlight" (lighter moments/side
// projects) are meant for the on-site career timeline only — everything
// else (job/current/release) counts as real professional experience with
// an inferable start/end range; "education" gets its own treatment.
// Shared by the CV builder, the on-site /resume page, and the History
// sidebar so the three can't quietly drift out of sync with each other.
export function isExperienceTag(tag?: string) {
  return tag !== 'origin' && tag !== 'education' && tag !== 'highlight';
}

export function isEducationTag(tag?: string) {
  return tag === 'education';
}
