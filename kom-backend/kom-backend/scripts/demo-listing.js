const http = require('http');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
  .split(/\r?\n/)
  .reduce((a, l) => {
    const i = l.indexOf('=');
    if (i > 0) a[l.slice(0, i).trim()] = l.slice(i + 1).trim();
    return a;
  }, {});

function req(method, ep, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const hdrs = { 'Content-Type': 'application/json' };
    if (token) hdrs['Authorization'] = 'Bearer ' + token;
    if (data) hdrs['Content-Length'] = Buffer.byteLength(data);
    const r = http.request(
      { hostname: '127.0.0.1', port: 3002, path: '/api/v1' + ep, method, headers: hdrs },
      res => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => {
          try { resolve({ s: res.statusCode, b: JSON.parse(d) }); }
          catch { resolve({ s: res.statusCode, b: d }); }
        });
      }
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  const ts = Date.now();

  // 1. Admin login
  const L = await req('POST', '/auth/login', {
    email: env.SUPER_ADMIN_EMAIL,
    password: env.SUPER_ADMIN_PASSWORD,
  });
  const adminTok = L.b.data?.tokens?.accessToken || L.b.data?.accessToken;
  console.log('1. Admin login:', L.s, adminTok ? '✅' : '❌');

  // 2. Register individual user
  const R = await req('POST', '/auth/register', {
    email: `demo${ts}@test.com`,
    password: 'Demo1234!',
    fullName: 'Demo User',
    phone: '+973' + ('' + ts).slice(-8),
    userType: 'INDIVIDUAL',
  });
  const userTok = R.b.data?.tokens?.accessToken || R.b.data?.accessToken;
  console.log('2. Register:', R.s, userTok ? '✅' : '❌');

  // 3. Admin creates package
  const P = await req('POST', '/packages/admin/individual', {
    name: 'DemoPkg' + ts,
    description: 'Demo package',
    listingCount: 5,
    maxStories: 2,
    price: 5,
    sortOrder: 9999,
  }, adminTok);
  const pkgId = P.b.data?.id;
  console.log('3. Create package:', P.s, pkgId ? '✅' : '❌', pkgId ? '' : JSON.stringify(P.b?.error || P.b));

  // 4. User initiates payment for individual package
  const PU = await req('POST', '/payments/individual-package/initiate', { packageId: pkgId }, userTok);
  const payId = PU.b.data?.transaction?.id || PU.b.data?.id;
  console.log('4. Initiate payment:', PU.s, payId ? '✅' : '❌');

  // 5. Submit payment proof
  await req('POST', '/payments/' + payId + '/submit-proof', {
    proofImageUrl: 'https://example.com/proof.jpg',
  }, userTok);
  console.log('5. Proof submitted ✅');

  // 6. Admin approves payment
  const AP = await req('PATCH', '/payments/admin/' + payId + '/review', {
    action: 'APPROVE',
    note: 'ok',
  }, adminTok);
  console.log('6. Approve payment:', AP.s, AP.s === 200 ? '✅' : '❌');

  // 7. Create the listing
  const CL = await req('POST', '/listings', {
    type: 'CAR',
    title: 'Toyota Camry 2023 - Full Demo',
    description: 'سيارة ممتازة بحالة ممتازة، صيانة دورية',
    price: 8500,
    currency: 'BHD',
    locationGovernorate: 'Capital',
    locationArea: 'Manama',
    contactPreference: 'CALL',
  }, userTok);
  const lId = CL.b.data?.id;
  console.log('7. Create listing:', CL.s, lId ? '✅ ID: ' + lId : '❌');

  // 8. Add car details
  const CD = await req('POST', '/listings/' + lId + '/details/car', {
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    transmission: 'AUTO',
    fuel: 'PETROL',
    condition: 'USED',
    color: 'White',
    engineSize: '2.5L',
  }, userTok);
  console.log('8. Car details:', CD.s, CD.s === 201 ? '✅' : '❌');

  // 9. SUBMIT the complete listing
  const S = await req('POST', '/listings/' + lId + '/submit', {}, userTok);

  console.log('\n========================================');
  console.log('  نتيجة رفع الإعلان الكامل');
  console.log('========================================');
  console.log('HTTP Status:', S.s);
  console.log(JSON.stringify(S.b, null, 2));
  console.log('========================================');

  if (S.s === 200 || S.s === 201) {
    console.log('✅ الإعلان رُفع بنجاح - الحالة: ' + S.b.data?.status);
  } else {
    console.log('❌ فشل الرفع - السبب:', S.b?.error?.message || JSON.stringify(S.b));
  }
}

main().catch(console.error);
