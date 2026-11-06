import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Extract buildApiUrl directly from mobile-app/src/api/client.js to evaluate in pure Node
const clientSrc = fs.readFileSync(path.resolve('mobile-app/src/api/client.js'), 'utf8');
const fnMatch = clientSrc.match(/export function buildApiUrl\([\s\S]*?\n\}/);
assert.ok(fnMatch, 'buildApiUrl function definition must be found in client.js');
const buildApiUrl = new Function(
  `${fnMatch[0].replace('export function buildApiUrl', 'return function buildApiUrl')}`,
)();

console.log('--- STRESS TESTING buildApiUrl ---');

const testCases = [
  // 1. Standard cases with /api base and /api/ endpoint
  {
    base: 'http://localhost:5000/api',
    endpoint: '/api/books',
    expected: 'http://localhost:5000/api/books',
    desc: 'baseUrl with /api and endpoint with /api/',
  },
  {
    base: 'http://localhost:5000/api',
    endpoint: 'books',
    expected: 'http://localhost:5000/api/books',
    desc: 'baseUrl with /api and endpoint without /api and no leading slash',
  },
  {
    base: 'http://localhost:5000/api',
    endpoint: '/books',
    expected: 'http://localhost:5000/api/books',
    desc: 'baseUrl with /api and endpoint with leading slash',
  },
  {
    base: 'http://localhost:5000/api',
    endpoint: '/api/auth/login',
    expected: 'http://localhost:5000/api/auth/login',
    desc: 'baseUrl with /api and endpoint /api/auth/login',
  },

  // 2. Base without /api
  {
    base: 'http://localhost:5000',
    endpoint: 'books',
    expected: 'http://localhost:5000/api/books',
    desc: 'baseUrl without /api and endpoint without slash',
  },
  {
    base: 'http://localhost:5000',
    endpoint: '/books',
    expected: 'http://localhost:5000/api/books',
    desc: 'baseUrl without /api and endpoint with slash',
  },
  {
    base: 'http://localhost:5000',
    endpoint: '/api/books',
    expected: 'http://localhost:5000/api/books',
    desc: 'baseUrl without /api and endpoint with /api/books',
  },
  {
    base: 'http://localhost:5000',
    endpoint: '/api/auth/login',
    expected: 'http://localhost:5000/api/auth/login',
    desc: 'baseUrl without /api and endpoint /api/auth/login',
  },

  // 3. Trailing slashes in base
  {
    base: 'http://localhost:5000/api/',
    endpoint: '/api/books',
    expected: 'http://localhost:5000/api/books',
    desc: 'baseUrl with /api/ and endpoint /api/books',
  },
  {
    base: 'http://localhost:5000/api///',
    endpoint: '/books',
    expected: 'http://localhost:5000/api/books',
    desc: 'baseUrl with multiple trailing slashes /api/// and endpoint /books',
  },
  {
    base: 'http://localhost:5000/',
    endpoint: '/books',
    expected: 'http://localhost:5000/api/books',
    desc: 'baseUrl http://localhost:5000/ and endpoint /books',
  },

  // 4. Android emulator address
  {
    base: 'http://10.0.2.2:5000/api',
    endpoint: '/api/books',
    expected: 'http://10.0.2.2:5000/api/books',
    desc: 'Android emulator base with /api/books',
  },
  {
    base: 'http://10.0.2.2:5000',
    endpoint: 'books',
    expected: 'http://10.0.2.2:5000/api/books',
    desc: 'Android emulator base without /api with books',
  },

  // 5. Query parameters and anchors
  {
    base: 'http://localhost:5000/api',
    endpoint: '/api/books?category=Sejarah&limit=10&page=1',
    expected: 'http://localhost:5000/api/books?category=Sejarah&limit=10&page=1',
    desc: 'URL with query string parameters',
  },
  {
    base: 'http://localhost:5000',
    endpoint: '/books?search=wahidiyah#section',
    expected: 'http://localhost:5000/api/books?search=wahidiyah#section',
    desc: 'URL with query string and hash',
  },
];

let passedCount = 0;
for (const tc of testCases) {
  const result = buildApiUrl(tc.base, tc.endpoint);
  assert.equal(
    result,
    tc.expected,
    `FAILED for ${tc.desc}: got ${result}, expected ${tc.expected}`,
  );
  passedCount++;
  console.log(`✔ [PASS] ${tc.desc} -> ${result}`);
}

console.log(`\nAll ${passedCount} core test cases passed!`);

// 6. Adversarial Corner-Case Analysis
console.log('\n--- ADVERSARIAL CORNER-CASE INVESTIGATION ---');

// Corner case A: endpoint is '/api' exactly
const cornerA = buildApiUrl('http://localhost:5000/api', '/api');
console.log(
  `Corner Case A: base='http://localhost:5000/api', endpoint='/api' -> result: '${cornerA}'`,
);

// Corner case B: endpoint is 'api' exactly
const cornerB = buildApiUrl('http://localhost:5000/api', 'api');
console.log(
  `Corner Case B: base='http://localhost:5000/api', endpoint='api' -> result: '${cornerB}'`,
);

// Corner case C: endpoint is '/api/'
const cornerC = buildApiUrl('http://localhost:5000/api', '/api/');
console.log(
  `Corner Case C: base='http://localhost:5000/api', endpoint='/api/' -> result: '${cornerC}'`,
);

// Corner case D: endpoint without string type (e.g. null/undefined)
let cornerDThrows = false;
try {
  buildApiUrl('http://localhost:5000/api', null);
} catch (e) {
  cornerDThrows = true;
  console.log(`Corner Case D: endpoint=null throws as expected (${e.message})`);
}

// Corner case E: baseUrl is empty string or undefined
const cornerE = buildApiUrl(undefined, '/books');
console.log(`Corner Case E: base=undefined, endpoint='/books' -> result: '${cornerE}'`);
