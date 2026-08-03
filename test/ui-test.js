/* =========================================================================
   Dashers — end-to-end UI test.

   Loads the real host and player pages in a simulated browser, connects them
   to a real server, and drives a full round by clicking actual buttons.

     npm install          (once, to get jsdom)
     npm test

   This exists because an earlier version shipped a Submit button that did
   nothing: two elements shared the id "sub", so getElementById handed back
   the wrong one. A server-only test could never have caught it. Hence the
   duplicate-id guard that runs at every phase below.
   ========================================================================= */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'public');
const PORT = process.env.TPORT || 4400;
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
function ok(label, cond, extra=''){ cond ? (pass++, console.log('  ✓ ' + label)) : (fail++, console.log('  ✗ ' + label + (extra?'  — '+extra:''))); }

function open(file, query=''){
  const html = fs.readFileSync(`${DIR}/${file}`, 'utf8');
  const dom = new JSDOM(html, {
    url: `http://127.0.0.1:${PORT}/${file}${query}`,
    runScripts: 'dangerously', pretendToBeVisual: true
  });
  dom.name = file + query;
  return dom;
}
const $ = (d, id) => d.window.document.getElementById(id);
const txt = d => d.window.document.body.textContent.replace(/\s+/g,' ');
function click(d, id){
  const el = $(d, id);
  if (!el) throw new Error(`[${d.name}] no element #${id}`);
  el.click();               // a real click event, exactly like a tap
  return el;
}
async function waitFor(fn, label, ms = 6000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (fn()) return true; await sleep(80); }
  throw new Error('timed out waiting for: ' + label);
}
// guards against the exact class of bug that broke Submit
function dupIds(d){
  const seen = {}, dups = [];
  d.window.document.querySelectorAll('[id]').forEach(e => {
    if (seen[e.id]) { if (!dups.includes(e.id)) dups.push(e.id); } else seen[e.id] = 1;
  });
  return dups;
}
// `let ST` lives in the script's lexical scope, not on window — reach it via eval
const S = d => { try { return d.window.eval('typeof ST !== \"undefined\" ? ST : null'); } catch { return null; } };
const phaseOf = d => { const s = S(d); return s ? s.phase : null; };

(async () => {
console.log('\n══ DASHERS — browser UI test ══\n');

/* ---------- board ---------- */
const host = open('host.html');
await waitFor(() => S(host) && S(host).code, 'board to get a code');
const code = S(host).code;
console.log(`Board is up, code ${code}\n`);

/* ---------- three phones ---------- */
console.log('JOINING');
const names = ['Georgie','Sam','Alex'];
const phones = names.map(() => open('play.html', '?c=' + code));
await sleep(600);
for (let i = 0; i < phones.length; i++){
  const p = phones[i];
  await waitFor(() => $(p,'join'), `join button on phone ${i+1}`);
  $(p,'code').value = code;
  $(p,'name').value = names[i];
  click(p, 'join');                                   // real tap
  await sleep(250);
}
await waitFor(() => S(host).players.length === 3, '3 players seated');
ok('three phones joined by tapping Sit down', S(host).players.length === 3);
ok('no duplicate ids on a phone at lobby', dupIds(phones[0]).length === 0, dupIds(phones[0]).join());
ok('no duplicate ids on the board at lobby', dupIds(host).length === 0, dupIds(host).join());

/* ---------- start ---------- */
console.log('\nSTARTING');
ok('Start button is enabled with 3 players', !$(host,'start').disabled);
click(host, 'start');
await waitFor(() => phaseOf(host) === 'choose', 'choose phase');
ok('board moved to category choice', phaseOf(host) === 'choose');

const dash  = phones.find(p => S(p).you.isDasher);
const rest  = phones.filter(p => !S(p).you.isDasher);
ok('exactly one phone is the Dasher', phones.filter(p => S(p).you.isDasher).length === 1);
ok('non-Dashers see a waiting screen', /Choosing a category/.test(txt(rest[0])));

/* ---------- category + preview ---------- */
console.log('\nDASHER PICKS A CARD');
dash.window.document.querySelector('[data-c="studies"]').click();
await waitFor(() => phaseOf(dash) === 'preview', 'preview phase');
ok('Dasher sees the real answer', /keep it to yourself/i.test(txt(dash)));
ok('Dasher sees plain-English instructions',
   /title of a real scientific study/i.test(txt(dash)));
ok('board does NOT show the answer',
   !txt(host).includes(S(dash).preview.answer));
ok('other players do NOT show the answer',
   !txt(rest[0]).includes(S(dash).preview.answer));

const card1 = S(dash).preview.prompt;
click(dash, 'redraw'); await sleep(300);
ok('Another card gives a different card', S(dash).preview.prompt !== card1);
click(dash, 'back'); await sleep(300);
ok('Category button returns to the category list', phaseOf(dash) === 'choose');

dash.window.document.querySelector('[data-c="business"]').click();
await sleep(300);
const truth = S(dash).preview.answer;
click(dash, 'lock');
await waitFor(() => phaseOf(host) === 'write', 'write phase');
ok('Lock it in opens the writing round', phaseOf(host) === 'write');

/* ---------- THE BUG ---------- */
console.log('\nSUBMITTING ANSWERS  (the step that was broken)');
ok('non-Dasher sees the instruction line',
   /some still trading, some long gone/i.test(txt(rest[0])));
ok('input has a helpful placeholder',
   ($(rest[0],'bluff').placeholder || '').length > 4, $(rest[0],'bluff').placeholder);
ok('no duplicate ids on the writing screen', dupIds(rest[0]).length === 0, dupIds(rest[0]).join());

$(rest[0],'bluff').value = 'Sells bespoke hats for garden gnomes';
click(rest[0], 'submitBluff');                       // tap Submit, not Enter
await sleep(350);
ok('TAPPING SUBMIT ACTUALLY SUBMITS', S(host).players.filter(p => p.submitted).length === 1,
   'submitted count = ' + S(host).players.filter(p => p.submitted).length);
ok('submitter sees confirmation', /Your lie is in/i.test(txt(rest[0])));
ok('board counter advanced', /1 \/ 2/.test(txt(host)));

// second player uses the Enter key instead
$(rest[1],'bluff').value = 'Rents out vintage fairground organs';
const ev = new rest[1].window.KeyboardEvent('keydown', { key:'Enter', bubbles:true });
$(rest[1],'bluff').dispatchEvent(ev);
await waitFor(() => phaseOf(host) === 'read', 'read phase');
ok('Enter key also submits', phaseOf(host) === 'read');
ok('pool has all bluffs plus the truth', S(host).poolSize === 3, 'size ' + S(host).poolSize);

/* ---------- read out ---------- */
console.log('\nREADING OUT');
click(dash, 'nx'); await sleep(200);
ok('first answer appears on the board', S(host).revealed === 1);
ok('first answer appears on players phones too', S(rest[0]).pool.length === 1);
click(dash, 'nx'); await sleep(180);
click(dash, 'nx'); await sleep(180);
ok('all three revealed', S(host).revealed === 3);
click(dash, 'nx');
await waitFor(() => phaseOf(host) === 'vote', 'vote phase');
ok('Open the vote works', phaseOf(host) === 'vote');

/* ---------- voting ---------- */
console.log('\nVOTING');
ok('no duplicate ids on the voting screen', dupIds(rest[0]).length === 0, dupIds(rest[0]).join());
const ownIdx = S(rest[0]).you.myPoolIndex;
const own = rest[0].window.document.querySelector(`li[data-i="${ownIdx}"]`);
ok('your own answer is not tappable', !own || !own.classList.contains('pick'));

const truthIdx = S(rest[0]).pool.findIndex(a => a.text === truth);
rest[0].window.document.querySelector(`li[data-i="${truthIdx}"]`).click();
await sleep(300);
ok('tapping a slip casts a vote', S(rest[0]).you.vote === truthIdx);
const wrong = S(rest[1]).pool.findIndex((a,i) => i !== S(rest[1]).you.myPoolIndex && a.text !== truth);
rest[1].window.document.querySelector(`li[data-i="${wrong}"]`).click();
await waitFor(() => phaseOf(host) === 'reveal', 'reveal phase');

/* ---------- reveal ---------- */
console.log('\nREVEAL');
const R = S(host).reveal;
ok('the truth is marked on the board', /the real answer/i.test(txt(host)));
ok('podium rendered', R.top3.length > 0);
const finderName = S(rest[0]).you.name;
const stolen = R.answers.find(a => a.author === finderName);
const expected = 2 + (stolen ? stolen.votes : 0);   // +2 for the truth, +1 per vote their lie stole
const got = R.scores.find(s => s.name === finderName).score;
ok(`finder scored ${expected} (2 for the truth + ${expected-2} stolen)`, got === expected, 'got ' + got);
ok('everyone else scored 0', R.scores.filter(s => s.name !== finderName).every(s => s.score === 0));
ok('points awarded = points explained', R.scores.reduce((n,s)=>n+s.score,0) === expected);
ok('players see the scoreboard too', /Scores/i.test(txt(rest[0])));
ok('no duplicate ids on the reveal screen', dupIds(rest[0]).length === 0, dupIds(rest[0]).join());

console.log('\nNEXT ROUND');
const d1 = S(host).dasherName;
click(dash, 'nr');
await waitFor(() => phaseOf(host) === 'choose', 'round 2');
ok('Dasher rotates', S(host).dasherName !== d1, `${d1} -> ${S(host).dasherName}`);
ok('scores carry over', S(host).players.find(p => p.name === finderName).score === expected);

/* ---------- styling ---------- */
console.log('\nSTYLING');
const css = fs.readFileSync(`${DIR}/theme.css`, 'utf8');
ok('font stack is sans-serif', /--font:[^;]*sans-serif/s.test(css) && !/serif;\s*$/m.test(css.match(/--font:[^;]*;/s)[0].replace('sans-serif','')));
ok('no serif variable left behind', !css.includes('var(--serif)'));
ok('colour scheme unchanged', css.includes('#24503F') && css.includes('#A4243B') && css.includes('#F4EAD5'));
ok('instruction style exists', css.includes('.cardhelp'));

console.log(`\n══ ${pass} passed, ${fail} failed ══\n`);
process.exit(fail ? 1 : 0);
})().catch(e => { console.error('\nTEST CRASHED:', e.message); process.exit(1); });
