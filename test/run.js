/* Boots a server on a spare port, runs the UI test against it, then exits. */
const { spawn } = require('child_process');
const path = require('path');
const PORT = 4400 + Math.floor(Math.random() * 300);

const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')],
  { env: { ...process.env, PORT }, stdio: 'ignore' });

setTimeout(() => {
  const test = spawn(process.execPath, [path.join(__dirname, 'ui-test.js')],
    { env: { ...process.env, TPORT: PORT }, stdio: 'inherit' });
  test.on('exit', code => { server.kill(); process.exit(code); });
}, 2500);
