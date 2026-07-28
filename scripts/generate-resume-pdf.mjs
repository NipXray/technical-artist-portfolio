// Renders the standalone /cv/en and /cv/id pages (src/pages/cv/[lang].astro,
// a dedicated professional CV document — deliberately separate from the
// dark-themed on-site /resume page) to public/cv/resume-en.pdf and
// resume-id.pdf, the files served by the Download buttons. Re-run this after
// editing Resume/Skills or the History timeline so the PDFs stay in sync.
//
// Requires the dev server running first: npm run dev (or astro dev --background)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const baseUrl = process.env.CV_BASE_URL ?? 'http://localhost:4321';
const browser = await chromium.launch();

for (const lang of ['en', 'id']) {
  const outPath = fileURLToPath(new URL(`../public/cv/resume-${lang}.pdf`, import.meta.url));
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/cv/${lang}`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
  });
  await page.close();
  console.log('Wrote', outPath);
}

await browser.close();
