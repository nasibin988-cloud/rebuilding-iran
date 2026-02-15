#!/usr/bin/env node
/**
 * Aggregate MC questions and AI questions from all 30 V3 sections
 * into public/data/mc-questions.json and public/data/ai-questions.json
 * Supports 3 tiers: standard, extended, scholarly
 */

const fs = require('fs');
const path = require('path');

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

const MC_TIERS = [
  { key: 'standard', file: 'mc-questions.json' },
  { key: 'extended', file: 'mc-questions-extended.json' },
  { key: 'scholarly', file: 'mc-questions-scholarly.json' },
];

const AI_TIERS = [
  { key: 'standard', file: 'ai-questions.json' },
  { key: 'extended', file: 'ai-questions-extended.json' },
  { key: 'scholarly', file: 'ai-questions-scholarly.json' },
];

function loadJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.questions)) return data.questions;
    console.error(`  WARNING: Unexpected format in ${filePath}`);
    return null;
  } catch (e) {
    console.error(`  ERROR parsing ${filePath}: ${e.message}`);
    return null;
  }
}

// Ensure output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ─── MC Questions ─────────────────────────────────────────────────
console.log('Building mc-questions.json (3 tiers)...\n');
const allMC = [];

for (const tier of MC_TIERS) {
  let tierCount = 0;
  console.log(`\n--- ${tier.key.toUpperCase()} tier ---`);

  for (const section of SECTIONS) {
    const dirName = `SP-IRAN-${section.num}-${section.code}`;
    const filePath = path.join(CONTENT_DIR, dirName, 'QUIZ', tier.file);
    const questions = loadJsonFile(filePath);

    if (!questions) continue;

    const enriched = questions.map(q => ({
      ...q,
      section: section.num,
      sectionName: section.name,
      sectionCode: section.code,
      tier: tier.key,
    }));

    allMC.push(...enriched);
    tierCount += questions.length;
    console.log(`  ${section.num} (${section.code}): ${questions.length} questions`);
  }

  console.log(`  ${tier.key} total: ${tierCount}`);
}

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'mc-questions.json'),
  JSON.stringify(allMC, null, 2),
  'utf8'
);

console.log(`\nTotal MC questions: ${allMC.length}`);

// ─── AI Questions ─────────────────────────────────────────────────
console.log('\nBuilding ai-questions.json (3 tiers)...\n');
const allAI = [];

for (const tier of AI_TIERS) {
  let tierCount = 0;
  console.log(`\n--- ${tier.key.toUpperCase()} tier ---`);

  for (const section of SECTIONS) {
    const dirName = `SP-IRAN-${section.num}-${section.code}`;
    const filePath = path.join(CONTENT_DIR, dirName, 'QUIZ', tier.file);
    const questions = loadJsonFile(filePath);

    if (!questions) continue;

    const enriched = questions.map(q => ({
      ...q,
      section: section.num,
      sectionName: section.name,
      sectionCode: section.code,
      tier: tier.key,
    }));

    allAI.push(...enriched);
    tierCount += questions.length;
    console.log(`  ${section.num} (${section.code}): ${questions.length} questions`);
  }

  console.log(`  ${tier.key} total: ${tierCount}`);
}

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'ai-questions.json'),
  JSON.stringify(allAI, null, 2),
  'utf8'
);

console.log(`\nTotal AI questions: ${allAI.length}`);

// ─── Summary ──────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`MC questions: ${allMC.length}`);
console.log(`AI questions: ${allAI.length}`);
console.log(`Output: ${OUTPUT_DIR}/`);
