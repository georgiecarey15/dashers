/* =========================================================================
   DASHERS — game server
   Express serves the static clients; ws carries all game traffic.
   Card answers never leave the server except to the Dasher who drew them.
   ========================================================================= */
const path = require('path');
const http = require('http');
const os = require('os');
const express = require('express');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');
const { CATEGORIES, DECK } = require('./deck');

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 16;
const MIN_PLAYERS = 3;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/healthz', (_, res) => res.send('ok'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

/* ---------------------------------------------------------------- helpers */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';          // no I or O
const rooms = new Map();

function newCode() {
  let c;
  do { c = Array.from({length:4}, () => LETTERS[Math.floor(Math.random()*LETTERS.length)]).join(''); }
  while (rooms.has(c));
  return c;
}
function shuffle(a){
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function lanAddress(){
  for (const list of Object.values(os.networkInterfaces())) {
    for (const n of list || []) {
      if (n.family === 'IPv4' && !n.internal) return n.address;
    }
  }
  return 'localhost';
}
const LAN = lanAddress();

/* ------------------------------------------------------------------ rooms */
function makeRoom(){
  const room = {
    code: newCode(),
    hosts: new Set(),
    players: [],
    phase: 'lobby',          // lobby|choose|preview|write|read|vote|reveal|over
    round: 0,
    dasherIdx: 0,
    catKey: null,
    card: null,
    used: {},
    subs: [],                // {pid, text}
    pool: [],                // {text, pid|null, real}
    votes: {},               // pid -> pool index
    revealed: 0,
    rev: null, revTimer: null,
    joinUrl: '',
    qr: '',
    touched: Date.now()
  };
  CATEGORIES.forEach(c => room.used[c.key] = []);
  rooms.set(room.code, room);
  return room;
}
const dasher = r => r.players[r.dasherIdx] || null;
const isDasher = (r, p) => !!dasher(r) && dasher(r).id === p.id;
const others = r => r.players.filter((_, i) => i !== r.dasherIdx);
const byId = (r, id) => r.players.find(p => p.id === id);

function drawCard(room, key){
  const all = DECK[key];
  if (room.used[key].length >= all.length) room.used[key] = [];
  const free = all.map((_, i) => i).filter(i => !room.used[key].includes(i));
  const idx = free[Math.floor(Math.random() * free.length)];
  room.used[key].push(idx);
  return { prompt: all[idx][0], answer: all[idx][1], idx };
}

/* ------------------------------------------------------------------ views */
function publicState(room){
  const showPrompt = ['write','read','vote','reveal'].includes(room.phase);
  const cat = room.catKey ? CATEGORIES.find(c => c.key === room.catKey) : null;
  return {
    t: 'state',
    code: room.code,
    phase: room.phase,
    round: room.round,
    joinUrl: room.joinUrl,
    qr: room.qr,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    players: room.players.map(p => ({
      id: p.id, name: p.name, score: p.score, connected: p.connected,
      isDasher: !!dasher(room) && dasher(room).id === p.id,
      submitted: room.subs.some(s => s.pid === p.id),
      voted: room.votes[p.id] != null
    })),
    dasherName: dasher(room) ? dasher(room).name : null,
    category: cat ? { key: cat.key, name: cat.name, task: cat.task,
                      help: cat.help, hint: cat.hint } : null,
    prompt: showPrompt && room.card ? room.card.prompt : null,
    pool: room.phase === 'read'
        ? room.pool.slice(0, room.revealed).map((a, i) => ({ i, text: a.text }))
        : (room.phase === 'vote' ? room.pool.map((a, i) => ({ i, text: a.text })) : []),
    revealed: room.revealed,
    poolSize: room.pool.length,
    needed: others(room).length,
    reveal: room.phase === 'reveal' ? revealView(room) : null,
    final: room.phase === 'over'
        ? [...room.players].sort((a,b) => b.score - a.score).map(p => ({ name: p.name, score: p.score }))
        : null
  };
}
function playerState(room, p){
  const s = publicState(room);
  const me = isDasher(room, p);
  s.you = {
    id: p.id, name: p.name, score: p.score, isDasher: me,
    submitted: room.subs.some(x => x.pid === p.id),
    vote: room.votes[p.id] != null ? room.votes[p.id] : null,
    myPoolIndex: room.pool.findIndex(a => a.pid === p.id)
  };
  if (me && room.phase === 'choose') s.categories = CATEGORIES;
  // Only the Dasher ever receives the real answer, and only while previewing.
  if (me && room.phase === 'preview' && room.card) {
    s.preview = { prompt: room.card.prompt, answer: room.card.answer };
  }
  return s;
}
function send(ws, obj){
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}
function broadcast(room){
  room.touched = Date.now();
  const pub = publicState(room);
  room.hosts.forEach(ws => send(ws, pub));
  room.players.forEach(p => send(p.ws, playerState(room, p)));
}

/* ------------------------------------------------------------- game phases */
function beginRound(room){
  room.round++;
  room.phase = 'choose';
  room.catKey = null; room.card = null;
  room.subs = []; room.pool = []; room.votes = {}; room.revealed = 0; clearReveal(room); room.rev = null;
  broadcast(room);
}
function buildPool(room){
  room.pool = shuffle(
    room.subs.map(s => ({ text: s.text, pid: s.pid, real: false }))
      .concat([{ text: room.card.answer, pid: null, real: true }])
  );
  room.revealed = 0;
  room.phase = 'read';
  broadcast(room);
}
/* ------------------------------------------------------ the drumroll reveal
   The reveal is staged so it plays out rather than landing all at once:

     stage 0        "the votes are in"      — suspense
     stage 1..k     the k most-voted answers, counted down worst to best
     stage k+1      the real answer
     stage k+2      everything, with scores

   Stages advance on a server timer so every screen stays in step. Nothing
   identifying the real answer is put on the wire until its own stage, so
   there is no peeking ahead in devtools.                                   */
const STAGE_MS = { suspense: 2000, count: 2800, truth: 3400 };

function revealView(room){
  const R = room.rev;
  if (!R) return null;
  const k          = R.order.length;
  const truthStage = k + 1;
  const finalStage = k + 2;
  const showTruth  = R.stage >= truthStage;
  const showAll    = R.stage >= finalStage;

  return {
    stage: R.stage, truthStage, finalStage,
    // counted down worst-placed first, so the biggest bluff lands last
    // Authors are withheld during the countdown too: the real answer has no
    // author, so naming everyone else's would point straight at it.
    podium: R.order.slice(0, Math.min(R.stage, k)).map(a => ({
      text: a.text, votes: a.votes, place: a.place,
      author: showTruth ? a.author : null,
      real:   showTruth ? a.real   : null
    })),
    truth:   showTruth ? { text: R.truth, author: R.truthVoters } : null,
    answers: showAll ? R.answers : null,
    scores:  showAll ? R.scores  : null,
    nobodyFound: showTruth ? R.nobodyFound : null,
    totalVotes: R.totalVotes
  };
}
function clearReveal(room){
  if (room.revTimer) { clearTimeout(room.revTimer); room.revTimer = null; }
}
function advanceReveal(room){
  const R = room.rev;
  if (!R) return;
  const finalStage = R.order.length + 2;
  if (R.stage >= finalStage) { clearReveal(room); return; }
  R.stage++;
  broadcast(room);
  if (R.stage >= finalStage) { clearReveal(room); return; }
  const next = R.stage >= R.order.length + 1 ? STAGE_MS.truth : STAGE_MS.count;
  room.revTimer = setTimeout(() => advanceReveal(room), next);
}
function skipReveal(room){
  if (!room.rev) return;
  clearReveal(room);
  room.rev.stage = room.rev.order.length + 2;
  broadcast(room);
}

function tally(room){
  const counts = room.pool.map(() => 0);
  const voters = room.pool.map(() => []);
  for (const pid of Object.keys(room.votes)) {
    const i = room.votes[pid];
    counts[i]++;
    const v = byId(room, +pid);
    if (v) voters[i].push(v.name);
  }

  const delta = {};
  room.players.forEach(p => delta[p.id] = 0);
  // +2 for finding the truth
  for (const pid of Object.keys(room.votes)) {
    if (room.pool[room.votes[pid]].real) delta[+pid] += 2;
  }
  // +1 for every vote your bluff stole
  room.pool.forEach((a, i) => { if (!a.real && a.pid != null && delta[a.pid] != null) delta[a.pid] += counts[i]; });
  // Dasher +3 if nobody found it
  const found = Object.keys(room.votes).some(pid => room.pool[room.votes[pid]].real);
  if (!found && dasher(room)) delta[dasher(room).id] += 3;

  room.players.forEach(p => p.score += delta[p.id] || 0);

  const answers = room.pool.map((a, i) => ({
    text: a.text,
    real: a.real,
    author: a.real ? null : (byId(room, a.pid) ? byId(room, a.pid).name : '—'),
    votes: counts[i],
    voters: voters[i]
  }));
  const top3 = answers.map(a => ({ ...a }))
                      .filter(a => a.votes > 0)
                      .sort((x, y) => y.votes - x.votes)
                      .slice(0, 3)
                      .map((a, i) => ({ ...a, place: i + 1 }));

  clearReveal(room);
  room.rev = {
    stage: 0,
    order: top3.slice().reverse(),          // third place first, winner last
    answers,
    truth: room.card.answer,
    truthVoters: voters[room.pool.findIndex(a => a.real)] || [],
    nobodyFound: !found,
    totalVotes: Object.keys(room.votes).length,
    scores: [...room.players].sort((a,b) => b.score - a.score)
             .map(p => ({ name: p.name, score: p.score, delta: delta[p.id] || 0,
                          isDasher: !!dasher(room) && dasher(room).id === p.id }))
  };
  room.phase = 'reveal';
  broadcast(room);
  room.revTimer = setTimeout(() => advanceReveal(room), STAGE_MS.suspense);
}

/* --------------------------------------------------------------- messaging */
let pidSeq = 1;

wss.on('connection', ws => {
  ws.room = null; ws.pid = null; ws.role = null;

  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    const room = ws.room ? rooms.get(ws.room) : null;
    const me = room && ws.pid ? byId(room, ws.pid) : null;
    const amDasher = room && me && isDasher(room, me);

    switch (m.t) {

      /* ---- host opens the board ---- */
      case 'host_create': {
        const r = makeRoom();
        let origin = String(m.origin || `http://${LAN}:${PORT}`);
        try {
          const u = new URL(origin);
          if (['localhost','127.0.0.1','[::1]','::1'].includes(u.hostname)) { u.hostname = LAN; origin = u.origin; }
        } catch {}
        r.joinUrl = `${origin}/play.html?c=${r.code}`;
        r.hosts.add(ws);
        ws.room = r.code; ws.role = 'host';
        QRCode.toString(r.joinUrl, { type:'svg', margin:1, width:220,
                                     color:{ dark:'#1D2E4A', light:'#F4EAD5' } })
          .then(svg => { r.qr = svg; broadcast(r); })
          .catch(() => broadcast(r));
        broadcast(r);
        return;
      }

      /* ---- host reconnects to an existing board ---- */
      case 'host_rejoin': {
        const r = rooms.get(String(m.code || '').toUpperCase());
        if (!r) return send(ws, { t:'error', msg:'That game has ended.' });
        r.hosts.add(ws); ws.room = r.code; ws.role = 'host';
        return broadcast(r);
      }

      /* ---- a phone joins ---- */
      case 'join': {
        const r = rooms.get(String(m.code || '').toUpperCase().trim());
        if (!r) return send(ws, { t:'error', msg:'No game with that code.' });

        // rejoin an existing seat
        if (m.pid) {
          const old = byId(r, +m.pid);
          if (old) {
            old.ws = ws; old.connected = true;
            ws.room = r.code; ws.pid = old.id; ws.role = 'player';
            send(ws, { t:'joined', pid: old.id, code: r.code, name: old.name });
            return broadcast(r);
          }
        }
        const name = String(m.name || '').trim().slice(0, 14);
        if (!name) return send(ws, { t:'error', msg:'Pick a name first.' });
        if (r.phase !== 'lobby') return send(ws, { t:'error', msg:'That game is already under way.' });
        if (r.players.length >= MAX_PLAYERS) return send(ws, { t:'error', msg:'That game is full (16 players).' });
        if (r.players.some(p => p.name.toLowerCase() === name.toLowerCase()))
          return send(ws, { t:'error', msg:'Someone already took that name.' });

        const p = { id: pidSeq++, name, ws, score: 0, connected: true };
        r.players.push(p);
        ws.room = r.code; ws.pid = p.id; ws.role = 'player';
        send(ws, { t:'joined', pid: p.id, code: r.code, name: p.name });
        return broadcast(r);
      }

      /* ---- host starts ---- */
      case 'start': {
        if (!room || room.phase !== 'lobby' || ws.role !== 'host') return;
        if (room.players.length < MIN_PLAYERS)
          return send(ws, { t:'error', msg:`You need at least ${MIN_PLAYERS} players.` });
        shuffle(room.players);
        room.players.forEach(p => p.score = 0);
        room.dasherIdx = 0; room.round = 0;
        return beginRound(room);
      }

      /* ---- Dasher draws a card from a category (sees the answer) ---- */
      case 'pick_cat': {
        if (!amDasher || room.phase !== 'choose') return;
        if (!DECK[m.cat]) return;
        room.catKey = m.cat;
        room.card = drawCard(room, m.cat);
        room.phase = 'preview';
        return broadcast(room);
      }

      /* ---- Dasher wants a different card in the same category ---- */
      case 'redraw': {
        if (!amDasher || room.phase !== 'preview') return;
        room.card = drawCard(room, room.catKey);
        return broadcast(room);
      }

      /* ---- Dasher backs out to the category list ---- */
      case 'back': {
        if (!amDasher || room.phase !== 'preview') return;
        room.phase = 'choose';
        room.catKey = null; room.card = null;
        return broadcast(room);
      }

      /* ---- Dasher locks the card in; bluff collection opens ---- */
      case 'lock': {
        if (!amDasher || room.phase !== 'preview') return;
        room.phase = 'write';
        return broadcast(room);
      }

      /* ---- a player submits a bluff ---- */
      case 'submit': {
        if (!room || !me || room.phase !== 'write' || amDasher) return;
        if (room.subs.some(s => s.pid === me.id)) return;
        const text = String(m.text || '').trim().slice(0, 160);
        if (text.length < 2) return send(ws, { t:'error', msg:'Write a bit more than that.' });
        const clash = room.subs.some(s => s.text.toLowerCase() === text.toLowerCase())
                   || text.toLowerCase() === room.card.answer.toLowerCase();
        if (clash) return send(ws, { t:'error', msg:'Someone already wrote that — reword it.' });
        room.subs.push({ pid: me.id, text });
        if (room.subs.length >= others(room).length) return buildPool(room);
        return broadcast(room);
      }

      /* ---- Dasher reveals the answers one at a time ---- */
      case 'reveal_next': {
        if (!amDasher || room.phase !== 'read') return;
        if (room.revealed < room.pool.length) { room.revealed++; return broadcast(room); }
        room.phase = 'vote';
        return broadcast(room);
      }

      /* ---- a player votes ---- */
      case 'vote': {
        if (!room || !me || room.phase !== 'vote' || amDasher) return;
        if (room.votes[me.id] != null) return;
        const i = Number(m.i);
        if (!(i >= 0 && i < room.pool.length)) return;
        if (room.pool[i].pid === me.id) return send(ws, { t:'error', msg:"That's your own answer." });
        room.votes[me.id] = i;
        if (Object.keys(room.votes).length >= others(room).length) return tally(room);
        return broadcast(room);
      }

      /* ---- move on ---- */
      /* ---- cut the drumroll short ---- */
      case 'skip_reveal': {
        if (!room || room.phase !== 'reveal') return;
        if (ws.role !== 'host' && !amDasher) return;
        return skipReveal(room);
      }

      case 'next_round': {
        if (!room || room.phase !== 'reveal') return;
        if (ws.role !== 'host' && !amDasher) return;
        clearReveal(room);
        room.dasherIdx = (room.dasherIdx + 1) % room.players.length;
        return beginRound(room);
      }
      case 'end_game': {
        if (!room || ws.role !== 'host') return;
        clearReveal(room);
        room.phase = 'over';
        return broadcast(room);
      }
      case 'play_again': {
        if (!room || ws.role !== 'host') return;
        clearReveal(room);
        room.players.forEach(p => p.score = 0);
        CATEGORIES.forEach(c => room.used[c.key] = []);
        room.phase = 'lobby'; room.round = 0; room.dasherIdx = 0;
        room.subs = []; room.pool = []; room.votes = {}; room.rev = null;
        return broadcast(room);
      }
    }
  });

  ws.on('close', () => {
    const room = ws.room ? rooms.get(ws.room) : null;
    if (!room) return;
    if (ws.role === 'host') { room.hosts.delete(ws); return; }
    const p = byId(room, ws.pid);
    if (!p) return;
    if (room.phase === 'lobby') {
      room.players = room.players.filter(x => x.id !== p.id);
    } else {
      p.connected = false; p.ws = null;
    }
    broadcast(room);
  });
});

/* sweep abandoned rooms every 10 minutes */
setInterval(() => {
  const cutoff = Date.now() - 3 * 60 * 60 * 1000;
  for (const [code, r] of rooms) if (r.touched < cutoff) rooms.delete(code);
}, 10 * 60 * 1000);

server.listen(PORT, () => {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   D A S H E R S   is dealing…            ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  console.log(`  Board (laptop / TV):  http://localhost:${PORT}`);
  console.log(`  Phones on this Wi-Fi: http://${LAN}:${PORT}\n`);
});
