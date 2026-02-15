import { SECTION_MAP } from './types';

interface CrossRef {
  text: string;
  slug: string;
  type: 'section' | 'lecture';
}

/**
 * Process HTML content to add clickable cross-reference links.
 * Detects patterns like:
 * - "Section 001" or "section 001"
 * - "Lecture 001-01" or "lecture 001-01"
 * - "see Section 003" or "refer to section 005"
 * - Section names like "Origins", "The Revolution", etc.
 */
export function addCrossReferenceLinks(html: string, currentSlug: string): string {
  // Build reverse lookup from section name to section number
  const nameToNum: Record<string, string> = {};
  for (const [num, info] of Object.entries(SECTION_MAP)) {
    nameToNum[info.name.toLowerCase()] = num;
    // Also add the id as a lookup
    nameToNum[info.id.toLowerCase()] = num;
  }

  let processed = html;

  // Pattern 1: Explicit lecture references like "Lecture 001-01" or "lecture 001-001"
  processed = processed.replace(
    /\b(lecture)\s+(\d{3})-(\d{1,3})\b/gi,
    (match, prefix, secNum, lecNum) => {
      const normalizedLec = lecNum.padStart(3, '0');
      const slug = `${secNum}-${normalizedLec}`;
      if (slug === currentSlug) return match; // Don't link to self
      return `<a href="/lecture/${slug}" class="cross-ref cross-ref-lecture" data-ref="${slug}">${match}</a>`;
    }
  );

  // Pattern 2: Explicit section references like "Section 001" or "section 001"
  processed = processed.replace(
    /\b(section)\s+(\d{3})\b/gi,
    (match, prefix, secNum) => {
      if (!SECTION_MAP[secNum]) return match;
      const slug = `${secNum}-001`; // Link to first lecture of section
      if (slug.startsWith(currentSlug.split('-')[0])) return match; // Don't link to current section
      const sectionName = SECTION_MAP[secNum].name;
      return `<a href="/lecture/${slug}" class="cross-ref cross-ref-section" data-ref="${secNum}" title="${sectionName}">${match}</a>`;
    }
  );

  // Pattern 3: Section name references (wrapped in quotes or bold)
  // Match section names when they appear after certain trigger words
  const triggerPhrases = [
    'see the',
    'refer to',
    'covered in',
    'discussed in',
    'explored in',
    'see our',
    'in the',
    'from the',
    'as discussed in',
    'as seen in',
    'as covered in',
  ];

  for (const [num, info] of Object.entries(SECTION_MAP)) {
    const sectionName = info.name;
    // Escape special regex characters in section name
    const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match section name after trigger phrases
    for (const trigger of triggerPhrases) {
      const regex = new RegExp(
        `(${trigger})\\s+(?:section\\s+(?:on\\s+)?)?[""]?\\b(${escapedName})\\b[""]?(?:\\s+section)?`,
        'gi'
      );
      processed = processed.replace(regex, (match, triggerPhrase, name) => {
        if (currentSlug.startsWith(num)) return match; // Don't link to current section
        const slug = `${num}-001`;
        return `${triggerPhrase} <a href="/lecture/${slug}" class="cross-ref cross-ref-section" data-ref="${num}" title="Section ${num}: ${sectionName}">${name}</a>`;
      });
    }
  }

  // Pattern 4: Standalone bold section names that exactly match section names
  // Only match when the section name appears in bold/strong tags
  for (const [num, info] of Object.entries(SECTION_MAP)) {
    const sectionName = info.name;
    const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match bold section names
    const boldRegex = new RegExp(
      `<strong>(${escapedName})</strong>(?!\\s*section)`,
      'gi'
    );
    processed = processed.replace(boldRegex, (match, name) => {
      if (currentSlug.startsWith(num)) return match;
      const slug = `${num}-001`;
      return `<a href="/lecture/${slug}" class="cross-ref cross-ref-section" data-ref="${num}" title="Section ${num}: ${sectionName}"><strong>${name}</strong></a>`;
    });
  }

  return processed;
}

/**
 * Extract all cross-references from HTML content.
 * Useful for building a "Related Sections" component.
 */
export function extractCrossReferences(html: string, currentSlug: string): CrossRef[] {
  const refs: CrossRef[] = [];
  const seenSlugs = new Set<string>();

  // Pattern 1: Explicit lecture references
  const lectureMatches = html.matchAll(/\b(?:lecture)\s+(\d{3})-(\d{1,3})\b/gi);
  for (const match of lectureMatches) {
    const normalizedLec = match[2].padStart(3, '0');
    const slug = `${match[1]}-${normalizedLec}`;
    if (slug !== currentSlug && !seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      refs.push({ text: match[0], slug, type: 'lecture' });
    }
  }

  // Pattern 2: Explicit section references
  const sectionMatches = html.matchAll(/\b(?:section)\s+(\d{3})\b/gi);
  for (const match of sectionMatches) {
    const secNum = match[1];
    if (SECTION_MAP[secNum]) {
      const slug = `${secNum}-001`;
      if (!slug.startsWith(currentSlug.split('-')[0]) && !seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        refs.push({ text: `Section ${secNum}: ${SECTION_MAP[secNum].name}`, slug, type: 'section' });
      }
    }
  }

  // Pattern 3: Section name references
  for (const [num, info] of Object.entries(SECTION_MAP)) {
    const sectionName = info.name;
    const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');

    if (regex.test(html) && !currentSlug.startsWith(num)) {
      const slug = `${num}-001`;
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        refs.push({ text: `Section ${num}: ${sectionName}`, slug, type: 'section' });
      }
    }
  }

  return refs;
}
