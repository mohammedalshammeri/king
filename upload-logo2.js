const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Use node-fetch style with https
const https = require('https');
const http = require('http');

const cloudName = 'dusyeyipu';
const apiKey = '997279774148662';
const apiSecret = 'wY4OgRevnxYykKyvVYW3XOev8ew';
const publicId = 'kom-platform/kom-logo';
const timestamp = Math.floor(Date.now() / 1000);

// Build signature
const sigStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

// Read logo file
const logoPath = path.join(__dirname, 'kom-mobile-app/assets/images/logo.png');
const fileContent = fs.readFileSync(logoPath);

// Build multipart form data boundary
const boundary = '----FormBoundary' + crypto.randomBytes(16).toString('hex');

const parts = [];
const addField = (name, value) => {
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${name}"\r\n\r\n` +
    `${value}\r\n`
  );
};

addField('api_key', apiKey);
addField('timestamp', String(timestamp));
addField('public_id', publicId);
addField('signature', signature);

const fileHeader = 
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="logo.png"\r\n` +
  `Content-Type: image/png\r\n\r\n`;

const closing = `\r\n--${boundary}--\r\n`;

const headersBuffer = Buffer.from(parts.join('') + fileHeader);
const closingBuffer = Buffer.from(closing);
const body = Buffer.concat([headersBuffer, fileContent, closingBuffer]);

const options = {
  hostname: 'api.cloudinary.com',
  path: `/v1_1/${cloudName}/image/upload`,
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  }
};

const req = https.request(options, res => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const data = Buffer.concat(chunks).toString();
    try {
      const json = JSON.parse(data);
      if (json.secure_url) {
        console.log('SUCCESS:', json.secure_url);
        fs.writeFileSync(path.join(__dirname, 'logo-url.txt'), json.secure_url);
      } else {
        console.log('UPLOAD ERROR:', JSON.stringify(json, null, 2));
        fs.writeFileSync(path.join(__dirname, 'logo-url.txt'), 'ERROR: ' + JSON.stringify(json));
      }
    } catch (e) {
      console.log('PARSE ERROR:', data.substring(0, 500));
      fs.writeFileSync(path.join(__dirname, 'logo-url.txt'), 'PARSE ERROR: ' + data.substring(0, 500));
    }
  });
});

req.on('error', e => {
  console.error('REQ ERROR:', e.message);
  fs.writeFileSync(path.join(__dirname, 'logo-url.txt'), 'REQ ERROR: ' + e.message);
});

req.write(body);
req.end();

console.log('Upload started, waiting for response...');
