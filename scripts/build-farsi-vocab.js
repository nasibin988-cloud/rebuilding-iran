#!/usr/bin/env node
/**
 * Build Farsi vocabulary data + MC questions from Persian-Vocab-Complete.csv
 * Outputs:
 *   public/data/farsi-vocab.json   -- full 12,705 entries
 *   public/data/farsi-questions.json -- pre-generated MC questions
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', '..', '..', '..', 'Persian', 'Persian-Vocab-Complete.csv');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

/* ── CSV Parser (handles quoted fields with commas) ── */
function parseCSV(text) {
  const rows = [];
  let i = 0;
  const lines = text.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = [];
    let j = 0;
    while (j < line.length) {
      if (line[j] === '"') {
        j++; // skip opening quote
        let val = '';
        while (j < line.length) {
          if (line[j] === '"' && line[j + 1] === '"') {
            val += '"';
            j += 2;
          } else if (line[j] === '"') {
            j++; // skip closing quote
            break;
          } else {
            val += line[j];
            j++;
          }
        }
        fields.push(val);
        if (line[j] === ',') j++; // skip comma
      } else {
        let val = '';
        while (j < line.length && line[j] !== ',') {
          val += line[j];
          j++;
        }
        fields.push(val);
        if (line[j] === ',') j++;
      }
    }
    rows.push(fields);
  }
  return rows;
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.log(`Skipping farsi vocab build: ${CSV_PATH} not found`);
    return;
  }
  console.log('Reading CSV...');
  let raw = fs.readFileSync(CSV_PATH, 'utf-8');
  // Strip BOM
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

  const rows = parseCSV(raw);
  const headers = rows[0].map(h => h.trim());
  const data = rows.slice(1);

  console.log(`Parsed ${data.length} entries with ${headers.length} columns`);

  // Build vocab array
  const vocab = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const entry = {};
    for (let c = 0; c < headers.length; c++) {
      entry[headers[c]] = (row[c] || '').trim();
    }
    entry._idx = i + 1; // 1-based index matching audio file numbering
    vocab.push(entry);
  }

  // Index by semantic field for smart distractors
  const byField = {};
  const byOrigin = {};
  const byDifficulty = {};
  for (const v of vocab) {
    const fields = (v['Semantic-Field'] || 'other').split(';').map(s => s.trim());
    for (const f of fields) {
      if (!byField[f]) byField[f] = [];
      byField[f].push(v);
    }
    const origin = (v['Origin'] || 'other').toLowerCase();
    if (!byOrigin[origin]) byOrigin[origin] = [];
    byOrigin[origin].push(v);
    const diff = v['Difficulty'] || '2';
    if (!byDifficulty[diff]) byDifficulty[diff] = [];
    byDifficulty[diff].push(v);
  }

  // Fisher-Yates shuffle helper
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Pick n distinct distractors from pool, excluding the correct entry
  function pickDistractors(correct, pool, n, keyFn) {
    const correctVal = keyFn(correct);
    const candidates = pool.filter(v => keyFn(v) !== correctVal && v._idx !== correct._idx);
    const shuffled = shuffle(candidates);
    const seen = new Set([correctVal]);
    const result = [];
    for (const c of shuffled) {
      const val = keyFn(c);
      if (!seen.has(val) && val) {
        seen.add(val);
        result.push(c);
        if (result.length >= n) break;
      }
    }
    return result;
  }

  // Get distractor pool: same semantic field first, then same difficulty, then all
  function getPool(entry) {
    const fields = (entry['Semantic-Field'] || 'other').split(';').map(s => s.trim());
    let pool = [];
    for (const f of fields) {
      pool = pool.concat(byField[f] || []);
    }
    // Deduplicate
    const seen = new Set();
    pool = pool.filter(v => {
      if (seen.has(v._idx)) return false;
      seen.add(v._idx);
      return true;
    });
    // If pool too small, add same difficulty
    if (pool.length < 10) {
      const diff = entry['Difficulty'] || '2';
      for (const v of (byDifficulty[diff] || [])) {
        if (!seen.has(v._idx)) {
          pool.push(v);
          seen.add(v._idx);
        }
      }
    }
    // Still too small, add all
    if (pool.length < 10) {
      for (const v of vocab) {
        if (!seen.has(v._idx)) {
          pool.push(v);
          seen.add(v._idx);
        }
      }
    }
    return pool;
  }

  // Build answer options: place correct at random position among A-D
  function buildOptions(correctText, distractorTexts) {
    const all = [correctText, ...distractorTexts.slice(0, 3)];
    const shuffled = shuffle(all);
    const keys = ['A', 'B', 'C', 'D'];
    const options = {};
    let correctKey = 'A';
    for (let i = 0; i < keys.length; i++) {
      options[keys[i]] = shuffled[i];
      if (shuffled[i] === correctText) correctKey = keys[i];
    }
    return { options, correct: correctKey };
  }

  console.log('Generating MC questions...');
  const questions = [];
  let qId = 0;

  for (const entry of vocab) {
    const pool = getPool(entry);
    const origin = (entry['Origin'] || 'other').toLowerCase();
    const entryType = (entry['Entry-Type'] || 'word').toLowerCase();
    const audioFile = String(entry._idx).padStart(5, '0') + '.mp3';

    const meta = {
      word: entry['Word'],
      transliteration: entry['Transliteration'],
      pos: entry['POS'],
      origin,
      root: entry['Root'],
      rootMeaning: entry['Root-Meaning'],
      rootFamily: entry['Root-Family'],
      purePersEquiv: entry['Pure-Pers-Equiv'],
      etymology: entry['Etymology'],
      example: entry['Example'],
      exampleEn: entry['Example-EN'],
      difficulty: entry['Difficulty'],
      entryType,
      audioFile,
      semanticField: entry['Semantic-Field'],
      register: entry['Register'],
      domain: entry['Domain'],
    };

    // 1. Recognition: Persian word -> English definition
    const recDistractors = pickDistractors(entry, pool, 3, v => v['English']);
    if (recDistractors.length >= 3) {
      const { options, correct } = buildOptions(
        entry['English'],
        recDistractors.map(d => d['English'])
      );
      questions.push({
        id: `farsi-rec-${++qId}`,
        question: entry['Word'],
        questionRtl: true,
        options,
        correct,
        explanation: `${entry['Word']} (${entry['Transliteration']}) means "${entry['English']}". ${entry['Etymology'] || ''}`.trim(),
        category: origin,
        categoryName: origin.charAt(0).toUpperCase() + origin.slice(1) + ' Origin',
        type: 'Recognition',
        meta,
      });
    }

    // 2. Production: English definition -> Persian word
    const prodDistractors = pickDistractors(entry, pool, 3, v => v['Word']);
    if (prodDistractors.length >= 3) {
      const { options, correct } = buildOptions(
        entry['Word'],
        prodDistractors.map(d => d['Word'])
      );
      questions.push({
        id: `farsi-prod-${++qId}`,
        question: entry['English'],
        options,
        optionsRtl: true,
        correct,
        explanation: `"${entry['English']}" in Farsi is ${entry['Word']} (${entry['Transliteration']}). ${entry['Etymology'] || ''}`.trim(),
        category: origin,
        categoryName: origin.charAt(0).toUpperCase() + origin.slice(1) + ' Origin',
        type: 'Production',
        meta,
      });
    }

    // 3. Pure Persian: loanword -> Pure Persian equivalent (only for entries with Pure-Pers-Equiv and non-persian origin)
    if (entry['Pure-Pers-Equiv'] && origin !== 'persian') {
      const pureCandidates = pool.filter(v =>
        v['Pure-Pers-Equiv'] && v._idx !== entry._idx && v['Pure-Pers-Equiv'] !== entry['Pure-Pers-Equiv']
      );
      const pureDistractors = shuffle(pureCandidates).slice(0, 3);
      if (pureDistractors.length >= 3) {
        const { options, correct } = buildOptions(
          entry['Pure-Pers-Equiv'],
          pureDistractors.map(d => d['Pure-Pers-Equiv'])
        );
        questions.push({
          id: `farsi-pure-${++qId}`,
          question: `What is the Pure Persian equivalent of ${entry['Word']}?`,
          questionRtl: false,
          options,
          optionsRtl: true,
          correct,
          explanation: `The Pure Persian equivalent of ${entry['Word']} (${origin}) is ${entry['Pure-Pers-Equiv']}. ${entry['Etymology'] || ''}`.trim(),
          category: origin,
          categoryName: origin.charAt(0).toUpperCase() + origin.slice(1) + ' Origin',
          type: 'Pure Persian',
          meta,
        });
      }
    }

    // 4. Idiom: Persian idiom -> English meaning (only for idioms)
    if (entryType === 'idiom') {
      const idiomPool = vocab.filter(v => (v['Entry-Type'] || '').toLowerCase() === 'idiom');
      const idiomDistractors = pickDistractors(entry, idiomPool, 3, v => v['English']);
      if (idiomDistractors.length >= 3) {
        const { options, correct } = buildOptions(
          entry['English'],
          idiomDistractors.map(d => d['English'])
        );
        questions.push({
          id: `farsi-idiom-${++qId}`,
          question: entry['Word'],
          questionRtl: true,
          options,
          correct,
          explanation: `The idiom ${entry['Word']} means "${entry['English']}". ${entry['Etymology'] || ''}`.trim(),
          category: origin,
          categoryName: origin.charAt(0).toUpperCase() + origin.slice(1) + ' Origin',
          type: 'Idiom',
          meta,
        });
      }
    }
  }

  console.log(`Generated ${questions.length} MC questions`);

  // Count by type
  const typeCounts = {};
  for (const q of questions) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
  }
  console.log('By type:', typeCounts);

  // Write outputs
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const vocabOut = vocab.map(v => {
    const { _idx, ...rest } = v;
    return { idx: _idx, ...rest };
  });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'farsi-vocab.json'),
    JSON.stringify(vocabOut),
    'utf-8'
  );
  console.log(`Wrote farsi-vocab.json (${vocabOut.length} entries)`);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'farsi-questions.json'),
    JSON.stringify(questions),
    'utf-8'
  );
  console.log(`Wrote farsi-questions.json (${questions.length} questions)`);
}

main();
