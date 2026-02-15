#!/usr/bin/env node
/**
 * Build a lunr.js search index from all lecture content
 * Outputs:
 *   - public/data/search-index.json (prebuilt lunr index)
 *   - public/data/search-docs.json (document metadata for results)
 */

const fs = require('fs');
const path = require('path');
const lunr = require('lunr');

const CONTENT_DIR = path.join(__dirname, '..', '..', 'V3', 'CONTENT');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

const SECTIONS = [
  { num: '001', code: 'ORIGINS', name: 'Origins' },
  { num: '002', code: 'EMPIRES', name: 'The First Empires' },
  { num: '003', code: 'CONQUEST', name: 'The Arab Conquest' },
  { num: '004', code: 'RENAISSANCE', name: 'The Persian Renaissance' },
  { num: '005', code: 'TRANSFORMATION', name: 'Empire, Conversion, Awakening' },
  { num: '006', code: 'MODERN', name: 'The Modern Era' },
  { num: '007', code: 'REVOLUTION', name: 'The Revolution' },
  { num: '008', code: 'REPUBLIC', name: 'The Islamic Republic' },
  { num: '009', code: 'SPIRIT', name: 'The Iranian Spirit' },
  { num: '010', code: 'TODAY', name: 'Iran Today and the Regime' },
  { num: '011', code: 'CLASSPHIL', name: 'Classical Political Philosophy' },
  { num: '012', code: 'ETHICS', name: 'Ethics and Moral Reasoning' },
  { num: '013', code: 'FREEDOM', name: 'Philosophy of Freedom' },
  { num: '014', code: 'CRITTHINK', name: 'Critical Thinking' },
  { num: '015', code: 'MEDIA', name: 'Media Literacy' },
  { num: '016', code: 'LAW', name: 'Law, Rights, and Justice' },
  { num: '017', code: 'POLSYSTEMS', name: 'Political Systems' },
  { num: '018', code: 'STATECRAFT', name: 'Governance and Statesmanship' },
  { num: '019', code: 'REVSCI', name: 'The Science of Revolution' },
  { num: '020', code: 'TRANSITIONS', name: 'Successful Transitions' },
  { num: '021', code: 'FAILURES', name: 'Failed Transitions' },
  { num: '022', code: 'ECONOMICS', name: 'How Economies Work' },
  { num: '023', code: 'IRANECON', name: "Iran's Economy" },
  { num: '024', code: 'NATIONBUILD', name: 'Nation-Building Economics' },
  { num: '025', code: 'GEOPOLITICS', name: 'Iran in Geopolitics' },
  { num: '026', code: 'DIASPORA', name: 'The Diaspora' },
  { num: '027', code: 'CIVIC', name: 'Civic Participation' },
  { num: '028', code: 'DAYAFTER', name: 'The Day After' },
  { num: '029', code: 'BUILDING', name: 'Building the New Iran' },
  { num: '030', code: 'LONGGAME', name: 'The Long Game' },
];

function getActForSection(num) {
  const n = parseInt(num, 10);
  if (n <= 10) return { act: 'Act I', actNum: 1 };
  if (n <= 16) return { act: 'Act II', actNum: 2 };
  if (n <= 27) return { act: 'Act III', actNum: 3 };
  return { act: 'Act IV', actNum: 4 };
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : 'Untitled';
}

function stripMarkdown(text) {
  return text
    .replace(/^#+\s+/gm, '')           // headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')     // italic
    .replace(/`([^`]+)`/g, '$1')       // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*]\s+/gm, '')         // list items
    .replace(/^\d+\.\s+/gm, '')        // numbered list
    .replace(/^>\s+/gm, '')            // blockquotes
    .replace(/---+/g, '')              // horizontal rules
    .replace(/\n{3,}/g, '\n\n')        // excessive newlines
    .trim();
}

function extractExcerpt(content, query = null, maxLength = 200) {
  const stripped = stripMarkdown(content);
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Building search index...\n');

const documents = [];
const tiers = ['standard', 'extended', 'scholarly'];

for (const section of SECTIONS) {
  const dirName = `SP-IRAN-${section.num}-${section.code}`;
  const { act, actNum } = getActForSection(section.num);

  for (const tier of tiers) {
    const tierPath = tier === 'standard' ? '' : `/${tier}`;
    const lectureDir = path.join(CONTENT_DIR, dirName, 'LECTURES', 'en' + tierPath);

    if (!fs.existsSync(lectureDir)) continue;

    const files = fs.readdirSync(lectureDir)
      .filter(f => f.endsWith('.md'))
      .sort();

    for (const file of files) {
      const lectureNum = file.substring(0, 3);
      const slug = `${section.num}-${lectureNum}`;
      const id = `${slug}-${tier}`;

      const content = fs.readFileSync(path.join(lectureDir, file), 'utf-8');
      const title = extractTitle(content);
      const plainText = stripMarkdown(content);
      const excerpt = extractExcerpt(content);

      documents.push({
        id,
        slug,
        tier,
        title,
        sectionNum: section.num,
        sectionName: section.name,
        act,
        actNum,
        content: plainText,
        excerpt,
      });
    }
  }
}

console.log(`Indexed ${documents.length} documents across all tiers\n`);

// Build lunr index (optimized - no full content, just titles, excerpts, key terms)
console.log('Building lunr index...');

// Extract key terms from content (names, places, concepts)
function extractKeyTerms(content, maxTerms = 50) {
  // Match capitalized words (proper nouns), quoted terms, and important-looking phrases
  const patterns = [
    /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,  // Capitalized phrases (names, places)
    /"([^"]+)"/g,                         // Quoted terms
    /\b(?:Shah|Ayatollah|Revolution|Constitution|Parliament|Empire|Dynasty|War|Treaty|Movement)\b/gi,
  ];

  const terms = new Set();
  for (const pattern of patterns) {
    const matches = content.match(pattern) || [];
    for (const match of matches) {
      const cleaned = match.replace(/"/g, '').trim();
      if (cleaned.length > 2 && cleaned.length < 50) {
        terms.add(cleaned.toLowerCase());
      }
    }
  }

  return Array.from(terms).slice(0, maxTerms).join(' ');
}

const idx = lunr(function() {
  this.ref('id');
  this.field('title', { boost: 10 });
  this.field('sectionName', { boost: 5 });
  this.field('excerpt', { boost: 2 });
  this.field('keyTerms');

  for (const doc of documents) {
    this.add({
      id: doc.id,
      title: doc.title,
      sectionName: doc.sectionName,
      excerpt: doc.excerpt,
      keyTerms: extractKeyTerms(doc.content),
    });
  }
});

// Create document lookup (without full content to save space)
const docLookup = {};
for (const doc of documents) {
  docLookup[doc.id] = {
    slug: doc.slug,
    tier: doc.tier,
    title: doc.title,
    sectionNum: doc.sectionNum,
    sectionName: doc.sectionName,
    act: doc.act,
    actNum: doc.actNum,
    excerpt: doc.excerpt,
  };
}

// Write outputs
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'search-index.json'),
  JSON.stringify(idx),
  'utf8'
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'search-docs.json'),
  JSON.stringify(docLookup),
  'utf8'
);

console.log(`\nSearch index built successfully!`);
console.log(`  - search-index.json: ${(fs.statSync(path.join(OUTPUT_DIR, 'search-index.json')).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`  - search-docs.json: ${(fs.statSync(path.join(OUTPUT_DIR, 'search-docs.json')).size / 1024).toFixed(2)} KB`);
