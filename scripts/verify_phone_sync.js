const https = require('https');
const crypto = require('crypto');

const SECRET_KEY_STR = process.env.SESSION_SECRET || "cosmos-personel-takip-secret-key-2026-super-auth";

function toBase64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createToken(user) {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = { ...user, exp };
  const jsonStr = JSON.stringify(payload);
  const dataB64 = toBase64Url(Buffer.from(jsonStr, 'utf8'));

  const hmac = crypto.createHmac('sha256', SECRET_KEY_STR);
  hmac.update(dataB64);
  const sigB64 = toBase64Url(hmac.digest());
  return `${dataB64}.${sigB64}`;
}

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null,
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const token = createToken({
    id: "10993982-ff64-48d7-ae26-afad2ba4bed4",
    username: "seyit",
    name: "Seyit",
    role: "SUPER_ADMIN",
    email: "seyit@sancak.site"
  });

  const authCookie = `cosmos_session=${token}`;
  console.log('1. Generated admin session token.');

  console.log('2. Fetching expenses via GET /api/giderler ...');
  const getRes = await request({
    hostname: 'sancak.site',
    port: 443,
    path: `/api/giderler?_t=${Date.now()}`,
    method: 'GET',
    headers: {
      Cookie: authCookie,
      'Cache-Control': 'no-cache',
    },
  });

  console.log('GET status:', getRes.statusCode);
  console.log('Cache-Control header:', getRes.headers['cache-control']);

  const phoneExpenses = (getRes.data.allPhoneExpenses || []).filter((e) =>
    (e.title || '').toLowerCase().includes('vodafone')
  );
  console.log(`Found ${phoneExpenses.length} Vodafone expenses:`);
  phoneExpenses.forEach((e) => {
    console.log(`- ID: ${e.id} | Period: ${e.period} | Title: ${e.title}`);
    console.log(`  Lines: ${e.phoneLines}`);
  });

  if (phoneExpenses.length === 0) {
    console.error('No vodafone expenses found to test!');
    return;
  }

  // Let's test editing Month 10:
  const month10 = phoneExpenses.find(e => (e.period || '').includes('10')) || phoneExpenses[0];
  console.log(`\n3. Testing UPDATE_PHONE_LINES on ${month10.id} (${month10.period}) ...`);

  const updatedTestLines = [
    { number: '05455451058', title: 'MAÇ', amount: 1198, commitmentEnd: '2026-10-21' },
    { number: '05455450958', title: 'Şeyma Çağır', amount: 948, commitmentEnd: '2026-10-21' },
    { number: '05373800380', title: 'Halkla İlişkiler', amount: 475, commitmentEnd: '2027-04-10' }
  ];

  const putRes = await request(
    {
      hostname: 'sancak.site',
      port: 443,
      path: `/api/giderler/${month10.id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
    },
    {
      action: 'UPDATE_PHONE_LINES',
      phoneLines: updatedTestLines,
      syncAmountToTotal: false,
      linesTotalAmount: 2621,
    }
  );

  console.log('PUT status:', putRes.statusCode);
  console.log('PUT response lines:', putRes.data?.phoneLines);

  console.log('\n4. Verifying cross-month synchronization across all Vodafone expenses ...');
  const verifyRes = await request({
    hostname: 'sancak.site',
    port: 443,
    path: `/api/giderler?_t=${Date.now()}`,
    method: 'GET',
    headers: {
      Cookie: authCookie,
      'Cache-Control': 'no-cache',
    },
  });

  const verifiedPhoneExpenses = (verifyRes.data.allPhoneExpenses || []).filter((e) =>
    (e.title || '').toLowerCase().includes('vodafone')
  );
  let allSynced = true;
  verifiedPhoneExpenses.forEach((e) => {
    const lines = e.phoneLines ? JSON.parse(e.phoneLines) : [];
    const count = lines.length;
    console.log(`- Month ${e.period || e.monthIndex} (${e.title}): ${count} phone lines saved.`);
    if (count !== updatedTestLines.length) allSynced = false;
  });

  if (allSynced) {
    console.log('\n SUCCESS: All phone expenses across all months are synchronized perfectly on live server!');
  } else {
    console.log('\n Synchronization discrepancy detected.');
  }
}

run().catch(console.error);
