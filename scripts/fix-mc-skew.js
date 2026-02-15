#!/usr/bin/env node
/**
 * Fix MC question answer skew by randomizing answer positions
 * This shuffles the options while updating the correct answer reference
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'public', 'data', 'mc-questions.json');
const BACKUP_FILE = path.join(__dirname, '..', 'public', 'data', 'mc-questions.backup.json');

// Seeded random for reproducibility
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function shuffleArray(arr, seed) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Read the questions
console.log('Reading mc-questions.json...');
const questions = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// Backup original
console.log('Creating backup...');
fs.writeFileSync(BACKUP_FILE, JSON.stringify(questions, null, 2), 'utf8');

// Stats before
const beforeStats = { A: 0, B: 0, C: 0, D: 0 };
for (const q of questions) {
  beforeStats[q.correct]++;
}
console.log('\nBefore distribution:');
console.log(`  A: ${beforeStats.A} (${(beforeStats.A / questions.length * 100).toFixed(1)}%)`);
console.log(`  B: ${beforeStats.B} (${(beforeStats.B / questions.length * 100).toFixed(1)}%)`);
console.log(`  C: ${beforeStats.C} (${(beforeStats.C / questions.length * 100).toFixed(1)}%)`);
console.log(`  D: ${beforeStats.D} (${(beforeStats.D / questions.length * 100).toFixed(1)}%)`);

// Shuffle each question's options
const letters = ['A', 'B', 'C', 'D'];
let shuffled = 0;

for (let i = 0; i < questions.length; i++) {
  const q = questions[i];

  // Use question ID as seed for reproducibility
  const seed = q.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  // Get current options
  const currentOptions = [
    { key: 'A', value: q.options.A },
    { key: 'B', value: q.options.B },
    { key: 'C', value: q.options.C },
    { key: 'D', value: q.options.D },
  ];

  // Find correct answer value
  const correctValue = q.options[q.correct];

  // Shuffle the options
  const shuffledOptions = shuffleArray(currentOptions, seed);

  // Build new options object and find new correct key
  const newOptions = {};
  let newCorrect = '';

  for (let j = 0; j < 4; j++) {
    const letter = letters[j];
    newOptions[letter] = shuffledOptions[j].value;
    if (shuffledOptions[j].value === correctValue) {
      newCorrect = letter;
    }
  }

  // Update the question
  if (q.correct !== newCorrect) {
    shuffled++;
  }
  q.options = newOptions;
  q.correct = newCorrect;
}

// Stats after
const afterStats = { A: 0, B: 0, C: 0, D: 0 };
for (const q of questions) {
  afterStats[q.correct]++;
}

console.log('\nAfter distribution:');
console.log(`  A: ${afterStats.A} (${(afterStats.A / questions.length * 100).toFixed(1)}%)`);
console.log(`  B: ${afterStats.B} (${(afterStats.B / questions.length * 100).toFixed(1)}%)`);
console.log(`  C: ${afterStats.C} (${(afterStats.C / questions.length * 100).toFixed(1)}%)`);
console.log(`  D: ${afterStats.D} (${(afterStats.D / questions.length * 100).toFixed(1)}%)`);

console.log(`\nShuffled ${shuffled} questions out of ${questions.length}`);

// Write fixed questions
fs.writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2), 'utf8');
console.log('\nFixed mc-questions.json saved!');
console.log('Backup saved to mc-questions.backup.json');
