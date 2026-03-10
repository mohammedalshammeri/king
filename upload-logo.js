const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const cloudName = 'dusyeyipu';
const apiKey = '997279774148662';
const apiSecret = 'wY4OgRevnxYykKyvVYW3XOev8ew';
const publicId = 'kom-platform/kom-logo';
const timestamp = Math.floor(Date.now() / 1000);

const sigStr = 'public_id=' + publicId + '&timestamp=' + timestamp + apiSecret;
const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

const fileContent = fs.readFileSync('./kom-mobile-app/assets/images/logo.png');
const dataUri = 'data:image/png;base64,' + fileContent.toString('base64');

const params = new URLSearchParams();
params.append('file', dataUri);
params.append('api_key', apiKey);
params.append('timestamp', String(timestamp));
params.append('public_id', publicId);
params.append('signature', signature);

const body = params.toString();
const options = {
  hostname: 'api.cloudinary.com',
  path: '/v1_1/' + cloudName + '/image/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.secure_url) console.log('SUCCESS:', json.secure_url);
      else console.log('ERROR:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('RAW:', data.substring(0, 500));
    }
  });
});
req.on('error', e => console.error('REQ ERROR:', e.message));
req.write(body);
req.end();
