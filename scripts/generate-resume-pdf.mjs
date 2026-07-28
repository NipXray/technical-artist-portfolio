// Renders the live /resume page (with its print: styling) to
// public/cv/resume.pdf — the file served by the "Download PDF" button and
// the CMS's default CV / Resume PDF field. Re-run this after editing the
// Resume/Skills content or the History timeline so the PDF stays in sync.
//
// Requires the dev server running first: npm run dev (or astro dev --background)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const url = process.env.RESUME_URL ?? 'http://localhost:4321/resume';
const outPath = fileURLToPath(new URL('../public/cv/resume.pdf', import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: outPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' }
});
await browser.close();

console.log('Wrote', outPath);
