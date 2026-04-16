const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const [localPath, remotePath] = process.argv.slice(2);
if (!localPath || !remotePath) {
  console.error('Usage: node vps_upload.js <localPath> <remotePath>');
  process.exit(1);
}

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) {
      console.error(err);
      conn.end();
      process.exit(1);
      return;
    }

    const remoteDir = path.posix.dirname(remotePath);
    const mkdirRecursive = (dir, callback) => {
      sftp.mkdir(dir, { mode: 0o755 }, (mkdirErr) => {
        if (!mkdirErr || mkdirErr.code === 4 || String(mkdirErr.message || '').includes('Failure')) {
          callback();
          return;
        }
        if (mkdirErr.code === 2) {
          mkdirRecursive(path.posix.dirname(dir), () => mkdirRecursive(dir, callback));
          return;
        }
        callback(mkdirErr);
      });
    };

    mkdirRecursive(remoteDir, (mkdirErr) => {
      if (mkdirErr) {
        console.error(mkdirErr);
        conn.end();
        process.exit(1);
        return;
      }

      sftp.fastPut(localPath, remotePath, (putErr) => {
        if (putErr) {
          console.error(putErr);
          conn.end();
          process.exit(1);
          return;
        }
        console.log(`uploaded ${path.basename(localPath)}`);
        conn.end();
      });
    });
  });
}).on('keyboard-interactive', (_name, _instructions, _instructionsLang, prompts, finish) => {
  finish((prompts || []).map(() => process.env.VPS_PASS || ''));
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
