import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import { LectureMeta, LectureFull, Section, SECTION_MAP, getActForSection, getSectionOrder } from './types';

const CONTENT_DIR = path.join(process.cwd(), '..', 'V3', 'CONTENT');

async function markdownToHtml(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(result);
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(3, Math.round(words / 200));
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : 'Untitled';
}

function getSectionDir(sectionNum: string): string | null {
  const info = SECTION_MAP[sectionNum];
  if (!info) return null;
  return `SP-IRAN-${sectionNum}-${info.id}`;
}

function getLecturePath(sectionNum: string, lectureNum: string, lang: string): string | null {
  const dirName = getSectionDir(sectionNum);
  if (!dirName) return null;

  const lectureDir = path.join(CONTENT_DIR, dirName, 'LECTURES', lang);
  if (!fs.existsSync(lectureDir)) return null;

  const files = fs.readdirSync(lectureDir)
    .filter(f => f.startsWith(lectureNum) && f.endsWith('.md'))
    .sort();

  if (files.length === 0) return null;
  return path.join(lectureDir, files[0]);
}

export function getAllLectures(lang: string = 'en'): LectureMeta[] {
  const lectures: LectureMeta[] = [];

  const sectionNums = getSectionOrder();

  for (const sectionNum of sectionNums) {
    const info = SECTION_MAP[sectionNum];
    const dirName = getSectionDir(sectionNum);
    if (!dirName) continue;

    const lectureDir = path.join(CONTENT_DIR, dirName, 'LECTURES', lang);
    if (!fs.existsSync(lectureDir)) continue;

    const { act, actNum } = getActForSection(sectionNum);

    const files = fs.readdirSync(lectureDir)
      .filter(f => f.endsWith('.md'))
      .sort();

    for (const file of files) {
      const lectureNum = file.substring(0, 3);
      const slug = `${sectionNum}-${lectureNum}`;
      const content = fs.readFileSync(path.join(lectureDir, file), 'utf-8');
      const title = extractTitle(content);
      const readingTime = estimateReadingTime(content);

      lectures.push({
        slug,
        title,
        sectionNum,
        sectionName: info.name,
        sectionId: info.id,
        lectureNum,
        act,
        actNum,
        readingTime,
      });
    }
  }

  return lectures;
}

export function getSections(lang: string = 'en'): Section[] {
  const lectures = getAllLectures(lang);
  const sectionMap = new Map<string, Section>();

  for (const lec of lectures) {
    if (!sectionMap.has(lec.sectionNum)) {
      sectionMap.set(lec.sectionNum, {
        num: lec.sectionNum,
        name: lec.sectionName,
        id: lec.sectionId,
        act: lec.act,
        actNum: lec.actNum,
        lectures: [],
      });
    }
    sectionMap.get(lec.sectionNum)!.lectures.push(lec);
  }

  const order = getSectionOrder();
  return Array.from(sectionMap.values()).sort((a, b) => order.indexOf(a.num) - order.indexOf(b.num));
}

export async function getLecture(slug: string, lang: string = 'en'): Promise<LectureFull | null> {
  const [sectionNum, lectureNum] = slug.split('-');
  if (!sectionNum || !lectureNum) return null;

  const filePath = getLecturePath(sectionNum, lectureNum, lang);
  if (!filePath) return null;

  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const html = await markdownToHtml(rawContent);

  const info = SECTION_MAP[sectionNum];
  if (!info) return null;

  const { act, actNum } = getActForSection(sectionNum);
  const title = extractTitle(rawContent);
  const readingTime = estimateReadingTime(rawContent);

  return {
    slug,
    title,
    sectionNum,
    sectionName: info.name,
    sectionId: info.id,
    lectureNum,
    act,
    actNum,
    readingTime,
    content: rawContent,
    html,
  };
}

export function getAllSlugs(lang: string = 'en'): string[] {
  return getAllLectures(lang).map(l => l.slug);
}

export function getAdjacentLectures(slug: string, lang: string = 'en'): { prev: LectureMeta | null; next: LectureMeta | null } {
  const all = getAllLectures(lang);
  const idx = all.findIndex(l => l.slug === slug);
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}

export async function getExtendedLecture(slug: string, lang: string = 'en'): Promise<{ html: string; readingTime: number } | null> {
  const [sectionNum, lectureNum] = slug.split('-');
  if (!sectionNum || !lectureNum) return null;

  const dirName = getSectionDir(sectionNum);
  if (!dirName) return null;

  const extDir = path.join(CONTENT_DIR, dirName, 'LECTURES', lang, 'extended');
  if (!fs.existsSync(extDir)) return null;

  const files = fs.readdirSync(extDir)
    .filter(f => f.startsWith(lectureNum) && f.endsWith('.md'))
    .sort();

  if (files.length === 0) return null;

  const rawContent = fs.readFileSync(path.join(extDir, files[0]), 'utf-8');
  const html = await markdownToHtml(rawContent);
  const readingTime = estimateReadingTime(rawContent);

  return { html, readingTime };
}

export async function getScholarlyLecture(slug: string, lang: string = 'en'): Promise<{ html: string; readingTime: number } | null> {
  const [sectionNum, lectureNum] = slug.split('-');
  if (!sectionNum || !lectureNum) return null;

  const dirName = getSectionDir(sectionNum);
  if (!dirName) return null;

  const scholDir = path.join(CONTENT_DIR, dirName, 'LECTURES', lang, 'scholarly');
  if (!fs.existsSync(scholDir)) return null;

  const files = fs.readdirSync(scholDir)
    .filter(f => f.startsWith(lectureNum) && f.endsWith('.md'))
    .sort();

  if (files.length === 0) return null;

  const rawContent = fs.readFileSync(path.join(scholDir, files[0]), 'utf-8');
  const html = await markdownToHtml(rawContent);
  const readingTime = estimateReadingTime(rawContent);

  return { html, readingTime };
}
