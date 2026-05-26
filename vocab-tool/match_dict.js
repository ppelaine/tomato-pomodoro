// Match OCR'd TOC words against DICTIONARY and build textbook entries
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');

// Extract DICTIONARY using bracket-depth scanning
const dictIdx = html.indexOf('const DICTIONARY = [');
const startIdx = html.indexOf('[', dictIdx) + 1;
let depth = 1, pos = startIdx;
while (depth > 0 && pos < html.length) {
  if (html[pos] === '[') depth++;
  else if (html[pos] === ']') depth--;
  pos++;
}
const dictContent = html.slice(startIdx, pos - 1);
const DICTIONARY = eval('[' + dictContent + '];');
const dictMap = {};
DICTIONARY.forEach(d => { dictMap[d.en.toLowerCase()] = d; });

function matchWord(en) {
  // Strip OCR artifact prefixes like '(' or other noise
  en = en.replace(/^[^a-zA-Z]+/, '');
  // Normalize common OCR errors
  const fixes = {
    'oclock': "o'clock", 'ted': 'ten', 'vear': 'wear', 'sed': 'bed',
    'iazy': 'lazy', 'reeze': 'freeze', 'lood': 'flood',
    'iow': 'low', 'iay': 'lay',
  };
  en = fixes[en] || en;
  const d = dictMap[en.toLowerCase()];
  if (d) return { en: d.en, zh: d.zh, phonetic: d.phonetic || '', pos: d.pos || '', def: d.def || '' };
  return { en, zh: '', phonetic: '', pos: '', def: '' };
}

// Load OCR data
const tocData = JSON.parse(fs.readFileSync('all_toc_words.json', 'utf-8'));

const results = {};
let totalWords = 0, totalMatched = 0, totalWithDef = 0;
const allMissingDef = [];
const allUnmatched = [];

for (const [bookName, data] of Object.entries(tocData)) {
  console.log(`\n=== ${bookName} ===`);
  const units = data.words.map((words, i) => {
    const matched = words.map(w => matchWord(w));
    const mCount = matched.filter(w => w.zh).length;
    const dCount = matched.filter(w => w.def).length;
    totalWords += matched.length;
    totalMatched += mCount;
    totalWithDef += dCount;

    const missingDef = matched.filter(w => !w.def).map(w => w.en);
    const unmatched = matched.filter(w => !w.zh).map(w => w.en);
    if (missingDef.length) allMissingDef.push(`  Unit ${i+1}: ${missingDef.join(', ')}`);
    if (unmatched.length) allUnmatched.push(`  Unit ${i+1}: ${unmatched.join(', ')}`);

    console.log(`  Unit ${i+1}: ${matched.length} words, ${mCount} matched zh, ${dCount} with def`);
    return { n: `Unit ${i + 1}`, w: matched };
  });

  results[bookName] = { units };
}

console.log(`\n=== Summary ===`);
console.log(`Total words: ${totalWords}, Matched zh: ${totalMatched}, With def: ${totalWithDef}`);

if (allUnmatched.length) {
  console.log(`\n--- Unmatched (no Chinese translation) ---`);
  allUnmatched.forEach(l => console.log(l));
}

if (allMissingDef.length) {
  console.log(`\n--- Missing English definitions ---`);
  allMissingDef.forEach(l => console.log(l));
}

// Save detailed results
fs.writeFileSync('toc_matched.json', JSON.stringify(results, null, 2));
console.log('\nSaved to toc_matched.json');
