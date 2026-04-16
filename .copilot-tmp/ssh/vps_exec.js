const { Client } = require('ssh2');

const command = process.argv.slice(2).join(' ');
if (!command) {
  console.error('Missing remote command');
  process.exit(1);
}

const conn = new Client();
console.log('ssh-helper: connecting');
conn.on('ready', () => {
  console.log('ssh-helper: ready');
  conn.exec(command, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      process.exit(1);
      return;
    }

    console.log('ssh-helper: exec started');

    stream
      .on('close', (code) => {
        console.log(`ssh-helper: stream closed with code ${code ?? 0}`);
        conn.end();
        process.exit(code || 0);
      })
      .on('data', (data) => process.stdout.write(data.toString()));

    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
}).on('keyboard-interactive', (_name, _instructions, _instructionsLang, prompts, finish) => {
  console.log('ssh-helper: keyboard-interactive');
  if (!prompts || prompts.length === 0) {
    finish([]);
    return;
  }

  finish(prompts.map(() => process.env.VPS_PASS || ''));
}).on('error', (err) => {
  console.error(err);
  process.exit(1);
}).connect({
  host: process.env.VPS_HOST,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASS,
  tryKeyboard: true,
  readyTimeout: 30000,
});
