// Automated smoke test for vocab-tool/index.html
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');

console.log('=== Vocab Tool Smoke Test ===');
console.log('File size:', html.length, 'bytes');

// 1. HTML structure
const checks = {
  'uploadZone': html.includes('id="uploadZone"'),
  'fileInput': html.includes('id="fileInput"'),
  'tocModeToggle': html.includes('tocModeToggle'),
  'userModal': html.includes('id="userModal"'),
  'addWordModal': html.includes('id="addWordModal"'),
  'textbookModal': html.includes('id="textbookModal"'),
  'gameSetup': html.includes('id="gameSetup"'),
  '</script>': html.includes('</script>'),
  '</body>': html.includes('</body>'),
  '</html>': html.includes('</html>'),
  '</style>': html.includes('</style>'),
};

let htmlOK = true;
for (const [k, v] of Object.entries(checks)) {
  if (!v) { console.log('  FAIL: HTML missing', k); htmlOK = false; }
}
if (htmlOK) console.log('[PASS] HTML structure complete');

// 2. Extract JS and check syntax
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) { console.log('FAIL: No inline script found'); process.exit(1); }
const js = match[1];
console.log('JS script size:', js.length, 'bytes');

try {
  new Function(js);
} catch (e) {
  console.log('FAIL: JS syntax error:', e.message);
  process.exit(1);
}
console.log('[PASS] JS syntax valid');

// 3. Function inventory
const funcDefs = js.match(/function\s+(\w+)/g) || [];
const funcNames = new Set(funcDefs.map(f => f.replace('function ', '')));
console.log('Functions defined:', funcNames.size);

// Critical functions
const required = [
  'handleFileInput', 'handleFile', 'toggleTOCMode',
  'importAllTOCWords', 'renderTOCReviewTable', 'importTOCWord', 'importTOCMatched',
  'seedTextbooks', 'getTextbooksData', 'saveTextbooksData', 'getTextbookDB',
  'switchTab', 'renderBank', 'loadData', 'saveData', 'saveWordToBank',
  'blankWordMixed', 'revealHint', 'startGame', 'backToMenu',
  'migrateToMultiUser', 'updateUserDisplay', 'getUsersMeta', 'saveUsersMeta',
  'onTextbookSearch', 'fetchUnitVocabOnline', 'importOne', 'importAllFound',
  'importManual', 'importAllNotFound', 'preprocessTOCImage', 'preprocessImage'
];

const missing = required.filter(f => !funcNames.has(f));
if (missing.length) {
  console.log('FAIL: Missing functions:', missing.join(', '));
} else {
  console.log('[PASS] All', required.length, 'critical functions present');
}

// 4. Check that all called functions are defined
const callMatches = js.match(/(\w+)\(/g) || [];
const allCalls = [...new Set(callMatches.map(c => c.slice(0, -1)))];

const builtins = new Set([
  'if', 'while', 'for', 'switch', 'catch', 'require', 'JSON', 'parseInt', 'parseFloat',
  'isNaN', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Math', 'RegExp', 'Error', 'isArray',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'encodeURI', 'decodeURI',
  'console', 'document', 'window', 'localStorage', 'navigator', 'URL', 'Image', 'Tesseract',
  'fetch', 'Map', 'Set', 'Promise', 'Intl', 'BigInt', 'Symbol', 'undefined', 'null',
  'getElementById', 'querySelector', 'querySelectorAll', 'addEventListener', 'createElement',
  'getContext', 'drawImage', 'getImageData', 'putImageData', 'appendChild', 'toLowerCase',
  'toUpperCase', 'trim', 'join', 'map', 'filter', 'reduce', 'forEach', 'find', 'findIndex',
  'sort', 'slice', 'splice', 'push', 'pop', 'shift', 'unshift', 'indexOf', 'includes',
  'replace', 'match', 'split', 'substring', 'substr', 'charAt', 'startsWith', 'endsWith',
  'parse', 'stringify', 'keys', 'values', 'entries', 'assign', 'from', 'of', 'now',
  'round', 'floor', 'ceil', 'abs', 'max', 'min', 'random', 'log', 'error', 'warn',
  'getItem', 'setItem', 'removeItem', 'clear', 'createObjectURL', 'revokeObjectURL',
  'then', 'catch', 'finally', 'resolve', 'reject', 'all', 'race',
  'preventDefault', 'stopPropagation', 'classList', 'style', 'dataset', 'target',
  'currentTarget', 'textContent', 'innerHTML', 'value', 'checked', 'disabled',
  'focus', 'blur', 'click', 'submit', 'toggle', 'add', 'remove', 'contains',
  'test', 'exec', 'toString', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
  'new', 'return', 'typeof', 'instanceof', 'delete', 'void', 'yield', 'await',
  'async', 'function', 'var', 'let', 'const', 'class', 'extends', 'super',
  'import', 'export', 'default', 'this', 'arguments', 'eval',
  // Common variables in the codebase
  'getWordBank', 'getErrors', 'toast', 'getTextbookDB', 'genTextbookDB',
  'buildTextbookLookup', 'getActiveUserId', 'getUserStorageKey',
]);

const externalCalls = allCalls.filter(c => !funcNames.has(c) && !builtins.has(c) && c.length > 1 && !/^[A-Z]/.test(c));

if (externalCalls.length) {
  console.log('WARN: Potentially undefined calls:', externalCalls.join(', '));
} else {
  console.log('[PASS] No undefined function calls detected');
}

// 5. Check DICTIONARY
const dictCount = (js.match(/\{en:['"]/g) || []).length;
console.log('DICTIONARY entries:', dictCount);

// 6. Check event listener wiring in INIT section
const initSection = js.substring(js.lastIndexOf('// INIT'));
const hasTabBtns = initSection.includes("querySelectorAll('.tab-btn')");
const hasUserModal = initSection.includes("getElementById('userModal')");
const hasUploadZone = js.includes("getElementById('uploadZone')");
console.log('Init wiring - tabBtns:', hasTabBtns, 'userModal:', hasUserModal, 'uploadZone:', hasUploadZone);

console.log('\n=== Summary ===');
const allPass = !missing.length && htmlOK;
console.log(allPass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED');
