export type CvLang = 'en' | 'id';

export const CV_LABELS: Record<CvLang, Record<string, string>> = {
  en: {
    documentTitle: 'Curriculum Vitae',
    professionalSummary: 'Professional Summary',
    skills: 'Technical Skills',
    experience: 'Professional Experience',
    education: 'Education',
    present: 'Present',
    graduated: 'Graduated'
  },
  id: {
    documentTitle: 'Daftar Riwayat Hidup',
    professionalSummary: 'Profil Profesional',
    skills: 'Keahlian Teknis',
    experience: 'Pengalaman Profesional',
    education: 'Pendidikan',
    present: 'Sekarang',
    graduated: 'Lulus Tahun'
  }
};

// Best-effort translation for this site's own default skill category names —
// a user-entered category that isn't one of these (a custom category they
// typed themselves) just displays as-is on both language versions, since
// there's no reliable way to auto-translate arbitrary free text.
const SKILL_CATEGORY_ID: Record<string, string> = {
  languages: 'Bahasa Pemrograman',
  software: 'Perangkat Lunak',
  specialties: 'Spesialisasi Inti'
};

export function translateSkillCategory(category: string, lang: CvLang) {
  if (lang === 'en') return category;
  return SKILL_CATEGORY_ID[category.toLowerCase()] ?? category;
}
