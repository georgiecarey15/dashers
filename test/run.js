/* Runs the deck checks, then boots a server and runs the browser UI test. */
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const deck = spawnSync(process.execPath, [path.join(__dirname, 'deck-test.js')], { stdio: 'inherit' });
if (deck.status !== 0) process.exit(deck.status);

const PORT = 4400 + Math.floor(Math.random() * 300);
const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')],
  { env: { ...process.env, PORT }, stdio: 'ignore' });

setTimeout(() => {
  const ui = spawn(process.execPath, [path.join(__dirname, 'ui-test.js')],
    { env: { ...process.env, TPORT: PORT }, stdio: 'inherit' });
  ui.on('exit', code => { server.kill(); process.exit(code); });
}, 2500);
