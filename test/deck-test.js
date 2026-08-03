/* =========================================================================
   Deck quality checks.

   A Balderdash deck fails in two quiet ways: prompts everyone already knows,
   and real answers that all read like encyclopaedia entries while the bluffs
   read like people. Both hand the game away. These assert against both.
   ========================================================================= */
const { CATEGORIES, DECK } = require('../deck');
let pass = 0, fail = 0;
const ok = (l, c, x = '') => c ? (pass++, console.log('  ✓ ' + l)) : (fail++, console.log('  ✗ ' + l + (x ? '  — ' + x : '')));

console.log('\n══ DECK ══\n');

/* --- structure --- */
ok('every category has cards', CATEGORIES.every(c => (DECK[c.key] || []).length >= 10));
ok('every card is a prompt and an answer',
   Object.values(DECK).every(cs => cs.every(c => Array.isArray(c) && c.length === 2 &&
     typeof c[0] === 'string' && c[0].trim() && typeof c[1] === 'string' && c[1].trim())));
ok('no duplicate prompts',
   (() => { const all = Object.values(DECK).flat().map(c => c[0].toLowerCase());
            return new Set(all).size === all.length; })());
ok('movie titles carry no year', DECK.movies.every(c => !/\(\s*\d{4}\s*\)/.test(c[0])));

/* --- too easy? --- */
const TOO_FAMILIAR = ['samsung','nokia','nintendo','shell','colgate','avon','wrigley','berkshire',
  'abercrombie','nimby','scuba','laser','radar','sonar','basic','captcha','asmr','nasdaq','zip code',
  'facebook','ipod','macintosh','ibm','mcdonald','war of the worlds','titanic','ada lovelace',
  'hedy lamarr','wicker man','being john malkovich'];
const prompts = Object.values(DECK).flat().map(c => c[0].toLowerCase());
const offenders = TOO_FAMILIAR.filter(t => prompts.some(p => p.includes(t)));
ok('no household-name prompts left', offenders.length === 0, offenders.join(', '));

/* --- does the real answer read like a person wrote it? --- */
for (const c of CATEGORIES) {
  const lens = DECK[c.key].map(x => x[1].length);
  const min = Math.min(...lens), max = Math.max(...lens);
  const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
  const sd  = Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length);
  // a deck written to one formula has a tight spread; a human-written one doesn't
  ok(`${c.name}: answers vary in length (${min}–${max}, sd ${sd.toFixed(0)})`, sd >= 18, `sd ${sd.toFixed(1)}`);
}
const allAnswers = Object.values(DECK).flat().map(c => c[1]);
ok('some answers are very short', allAnswers.filter(a => a.length < 45).length >= 8);
ok('some answers run to more than one sentence',
   allAnswers.filter(a => (a.match(/[.!?] /g) || []).length >= 1).length >= 25);
ok('not every answer opens the same way',
   (() => { const firsts = allAnswers.map(a => a.split(' ')[0].toLowerCase());
            const top = Object.values(firsts.reduce((m, w) => (m[w] = (m[w]||0)+1, m), {}))
                              .sort((a,b) => b-a)[0];
            return top / allAnswers.length < 0.16; })());

console.log(`\n══ ${pass} passed, ${fail} failed ══\n`);
process.exit(fail ? 1 : 0);
