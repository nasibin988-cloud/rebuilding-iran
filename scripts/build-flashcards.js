#!/usr/bin/env node
/**
 * Build flashcards.json from all 30 V3 sections' cloze card YAML files.
 * Supports 3 tiers: standard, extended, scholarly
 * V3 format: flat `cards:` array with `cloze` field and IDs like `001-L01-C01`
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONTENT_DIR = path.join(__dirname, '..', '..', 'V3', 'CONTENT');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'flashcards.json');

const TIERS = [
  { key: 'standard', file: 'cloze-cards-en.yaml' },
  { key: 'extended', file: 'cloze-cards-extended-en.yaml' },
  { key: 'scholarly', file: 'cloze-cards-scholarly-en.yaml' },
];

// V3: 30 sections in 4 acts (sequential order)
const SECTIONS = [
  // Act I: The Story of Iran
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
  // Act II: Philosophical Foundations
  { num: '011', code: 'CLASSPHIL', name: 'Classical Political Philosophy' },
  { num: '012', code: 'ETHICS', name: 'Ethics and Moral Reasoning' },
  { num: '013', code: 'FREEDOM', name: 'Philosophy of Freedom' },
  { num: '014', code: 'CRITTHINK', name: 'Critical Thinking' },
  { num: '015', code: 'MEDIA', name: 'Media Literacy' },
  { num: '016', code: 'LAW', name: 'Law, Rights, and Justice' },
  // Act III: The Science of Change
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
  // Act IV: The Blueprint
  { num: '028', code: 'DAYAFTER', name: 'The Day After' },
  { num: '029', code: 'BUILDING', name: 'Building the New Iran' },
  { num: '030', code: 'LONGGAME', name: 'The Long Game' },
];

/**
 * Extract cards from parsed YAML.
 * V3 format: top-level `cards:` key containing a flat array of card objects.
 * Also handles legacy `lecture_NNN_cards` format for backwards compatibility.
 */
function extractCards(parsed) {
  const allCards = [];

  // V3 format: flat cards array
  if (parsed.cards && Array.isArray(parsed.cards)) {
    return parsed.cards;
  }

  // Legacy format: lecture_NNN_cards keys (V2 compat)
  let container = parsed;
  if (parsed.cards && typeof parsed.cards === 'object') {
    container = parsed.cards;
  }

  const lectureKeys = Object.keys(container)
    .filter(k => /^lecture_\d+_cards$/.test(k))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0], 10);
      const numB = parseInt(b.match(/\d+/)[0], 10);
      return numA - numB;
    });

  for (const key of lectureKeys) {
    const cards = container[key];
    if (Array.isArray(cards)) {
      allCards.push(...cards);
    }
  }

  return allCards;
}

/**
 * Get the cloze text from a card (handles `cloze` or `text` field).
 */
function getClozeText(card) {
  return card.cloze || card.text || '';
}

/**
 * Get the lecture number from a card.
 * V3 IDs like "001-L01-C01" → extract "01" → pad to "001"
 * Legacy: `lecture` or `lecture_num` field
 */
function getLecture(card) {
  // V3 format: ID like "001-L01-C01"
  if (card.id) {
    const match = card.id.match(/-L(\d+)-/);
    if (match) return String(parseInt(match[1], 10)).padStart(3, '0');
  }
  if (card.lecture != null) {
    return String(card.lecture).padStart(3, '0');
  }
  if (card.lecture_num != null) {
    return String(card.lecture_num).padStart(3, '0');
  }
  return '000';
}

/**
 * Build the `front` field:
 *   Replace the FIRST {{c1::answer}} with [...]
 *   Remove other cloze markers (show their content plainly)
 */
function buildFront(clozeText) {
  let replacedFirst = false;
  let result = clozeText.replace(/\{\{c(\d+)::([^}]*)\}\}/g, (match, num, answer) => {
    if (num === '1' && !replacedFirst) {
      replacedFirst = true;
      return '[...]';
    }
    return answer;
  });
  return result;
}

/**
 * Build the `back` field:
 *   Extract the content inside the FIRST {{c1::...}}
 */
function buildBack(clozeText) {
  const match = clozeText.match(/\{\{c1::([^}]*)\}\}/);
  return match ? match[1] : '';
}

/**
 * Build the `fullText` field:
 *   Replace ALL {{cN::answer}} with <strong>answer</strong>
 */
function buildFullText(clozeText) {
  return clozeText.replace(/\{\{c\d+::([^}]*)\}\}/g, '<strong>$1</strong>');
}

/**
 * Process a single section for a specific tier and return its flashcard objects.
 */
function processSection(section, tier) {
  const dirName = `SP-IRAN-${section.num}-${section.code}`;
  const yamlPath = path.join(CONTENT_DIR, dirName, 'CARDS', tier.file);

  if (!fs.existsSync(yamlPath)) {
    return [];
  }

  const raw = fs.readFileSync(yamlPath, 'utf8');
  let parsed;
  try {
    parsed = yaml.load(raw);
  } catch (e) {
    console.error(`  ERROR parsing ${yamlPath}: ${e.message}`);
    return [];
  }

  const cards = extractCards(parsed);
  const results = [];

  for (const card of cards) {
    const clozeText = getClozeText(card);
    if (!clozeText) {
      continue;
    }

    const lecture = getLecture(card);
    const tag = section.code.toLowerCase();

    results.push({
      id: card.id,
      front: buildFront(clozeText),
      back: buildBack(clozeText),
      fullText: buildFullText(clozeText),
      type: card.type || 'KEY_POINT',
      section: section.num,
      sectionName: section.name,
      lecture: lecture,
      tier: tier.key,
      tags: [tag],
    });
  }

  return results;
}

// ============================================================
// Main
// ============================================================

console.log('Building flashcards.json from 30 V3 sections (3 tiers)...\n');

const allFlashcards = [];
const tierCounts = {};

for (const tier of TIERS) {
  const tierCards = [];
  console.log(`\n--- ${tier.key.toUpperCase()} tier ---`);

  for (const section of SECTIONS) {
    const cards = processSection(section, tier);
    tierCards.push(...cards);
    if (cards.length > 0) {
      console.log(`  Section ${section.num} (${section.code}): ${cards.length} cards`);
    }
  }

  tierCounts[tier.key] = tierCards.length;
  allFlashcards.push(...tierCards);
  console.log(`  ${tier.key} total: ${tierCards.length} cards`);
}

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write output
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allFlashcards, null, 2), 'utf8');

// Summary
console.log('\n========================================');
console.log(`Total cards: ${allFlashcards.length}`);
for (const tier of TIERS) {
  console.log(`  ${tier.key}: ${tierCounts[tier.key] || 0}`);
}
console.log(`Output: ${OUTPUT_FILE}`);
