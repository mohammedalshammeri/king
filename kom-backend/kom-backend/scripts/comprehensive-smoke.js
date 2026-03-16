const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.KOM_BASE_URL || 'http://127.0.0.1:3002';
const API_BASE = process.env.KOM_API_BASE || `${BASE_URL}/api/v1`;
const ENV_PATH = path.join(__dirname, '..', '.env');
const SUMMARY_PATH = path.join(__dirname, 'comprehensive-smoke-summary.json');
const RESULTS_PATH = path.join(__dirname, 'comprehensive-smoke-results.json');
const VIDEO_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'kom-mobile-app',
  'assets',
  'images',
  'White Modern Beauty Logo (1).mp4',
);

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    env[key] = value;
  }
  return env;
}

const env = parseEnvFile(ENV_PATH);
const ADMIN_EMAIL = process.env.KOM_ADMIN_EMAIL || env.SUPER_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.KOM_ADMIN_PASSWORD || env.SUPER_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Missing admin credentials. Set KOM_ADMIN_EMAIL/KOM_ADMIN_PASSWORD or .env values.');
}

function nowStamp() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const runId = nowStamp();
const uniquePhoneSuffix = `${Date.now()}`.slice(-8);
const individual = {
  email: `smoke.individual.${runId}@example.com`,
  password: 'SmokeTest123!',
  fullName: `Smoke Individual ${runId}`,
  phone: `+973${uniquePhoneSuffix}`,
};
const showroom = {
  email: `smoke.showroom.${runId}@example.com`,
  password: 'SmokeTest123!',
  showroomName: `Smoke Showroom ${runId}`,
  phone: `+973${`${Number(uniquePhoneSuffix) + 1}`.padStart(8, '0')}`,
  crNumber: `CR-${Date.now()}`,
};

const state = {
  adminToken: null,
  individualToken: null,
  showroomToken: null,
  adminUser: null,
  individualUser: null,
  showroomUser: null,
  individualPackage: null,
  showroomPackage: null,
  individualPayment: null,
  showroomPayment: null,
  badListing: null,
  individualListing: null,
  showroomListing: null,
  story: null,
  storyComment: null,
  chatThread: null,
};

const results = [];

function logResult(name, ok, details) {
  const entry = { name, ok, details };
  results.push(entry);
  const marker = ok ? '[PASS]' : '[FAIL]';
  console.log(`${marker} ${name}`);
  if (details) {
    console.log(JSON.stringify(details, null, 2));
  }
}

function record(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then((details) => {
      logResult(name, true, details);
      return details;
    })
    .catch((error) => {
      const details = {
        message: error.message,
        status: error.status,
        body: error.body,
        stack: error.stack,
      };
      logResult(name, false, details);
      throw error;
    });
}

async function apiFetch(method, endpoint, options = {}) {
  const headers = Object.assign({}, options.headers || {});
  let body = options.body;

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (body && !(body instanceof FormData) && typeof body !== 'string' && !Buffer.isBuffer(body)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body,
  });

  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} for ${method} ${endpoint}`);
    error.status = response.status;
    error.body = parsed;
    throw error;
  }

  if (
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    Object.prototype.hasOwnProperty.call(parsed, 'success') &&
    Object.prototype.hasOwnProperty.call(parsed, 'data')
  ) {
    return parsed.data;
  }

  return parsed;
}

async function postJson(endpoint, body, token) {
  return apiFetch('POST', endpoint, { body, token });
}

async function patchJson(endpoint, body, token) {
  return apiFetch('PATCH', endpoint, { body, token });
}

async function getJson(endpoint, token) {
  return apiFetch('GET', endpoint, { token });
}

async function deleteJson(endpoint, token) {
  return apiFetch('DELETE', endpoint, { token });
}

async function registerUsers() {
  const individualRegister = await postJson('/auth/register', {
    email: individual.email,
    password: individual.password,
    phone: individual.phone,
    userType: 'INDIVIDUAL',
    fullName: individual.fullName,
  });
  state.individualToken = individualRegister.accessToken;
  state.individualUser = individualRegister.user;

  const showroomRegister = await postJson('/auth/register', {
    email: showroom.email,
    password: showroom.password,
    phone: showroom.phone,
    userType: 'SHOWROOM',
    showroomName: showroom.showroomName,
    merchantType: 'CAR_SHOWROOM',
    crNumber: showroom.crNumber,
    governorate: 'Capital',
    city: 'Manama',
  });
  state.showroomToken = showroomRegister.accessToken;
  state.showroomUser = showroomRegister.user;

  return {
    individualHasToken: !!individualRegister.accessToken,
    showroomHasToken: !!showroomRegister.accessToken,
    individualRole: individualRegister.user.role,
    showroomRole: showroomRegister.user.role,
  };
}

async function loginAdmin() {
  const adminLogin = await postJson('/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  state.adminToken = adminLogin.accessToken;
  state.adminUser = adminLogin.user;
  return {
    adminRole: adminLogin.user.role,
    adminEmail: adminLogin.user.email,
  };
}

async function createPackages() {
  state.individualPackage = await postJson(
    '/packages/admin/individual',
    {
      name: `Smoke Individual Package ${runId}`,
      description: 'Temporary package for smoke testing',
      listingCount: 2,
      maxStories: 2,
      price: 1.5,
      sortOrder: 9998,
    },
    state.adminToken,
  );

  state.showroomPackage = await postJson(
    '/packages/admin',
    {
      name: `Smoke Showroom Package ${runId}`,
      description: 'Temporary showroom package for smoke testing',
      priceMonthly: 2.5,
      price3Months: 6.5,
      maxListings: 2,
      maxStories: 2,
      durationDays: 30,
      sortOrder: 9998,
    },
    state.adminToken,
  );

  return {
    individualPackageId: state.individualPackage.id,
    showroomPackageId: state.showroomPackage.id,
  };
}

async function activatePackagesThroughPayments() {
  const individualInitiated = await postJson(
    '/payments/individual-package/initiate',
    { packageId: state.individualPackage.id },
    state.individualToken,
  );
  state.individualPayment = individualInitiated.transaction;

  await postJson(
    `/payments/${state.individualPayment.id}/submit-proof`,
    { proofImageUrl: 'https://example.com/proof-individual.png' },
    state.individualToken,
  );

  const pendingAfterIndividual = await getJson('/payments/admin/pending-review', state.adminToken);

  await patchJson(
    `/payments/admin/${state.individualPayment.id}/review`,
    { action: 'APPROVE', note: 'Smoke test individual package approval' },
    state.adminToken,
  );

  const showroomInitiated = await postJson(
    '/payments/subscription/initiate',
    { packageId: state.showroomPackage.id, durationChoice: '1' },
    state.showroomToken,
  );
  state.showroomPayment = showroomInitiated.transaction;

  await postJson(
    `/payments/${state.showroomPayment.id}/submit-proof`,
    { proofImageUrl: 'https://example.com/proof-showroom.png' },
    state.showroomToken,
  );

  await patchJson(
    `/payments/admin/${state.showroomPayment.id}/review`,
    { action: 'APPROVE', note: 'Smoke test showroom subscription approval' },
    state.adminToken,
  );

  const myCredits = await getJson('/packages/my-credits', state.individualToken);
  const mySubscription = await getJson('/packages/my-subscription', state.showroomToken);
  const myTransactions = await getJson('/payments/my-transactions', state.individualToken);

  return {
    pendingReviewCountAfterIndividualProof: Array.isArray(pendingAfterIndividual)
      ? pendingAfterIndividual.length
      : null,
    creditsBundles: myCredits.length,
    subscriptionStatus: mySubscription ? mySubscription.status : null,
    transactionsCount: myTransactions.length,
  };
}

function carCreatePayload(title, price) {
  return {
    type: 'CAR',
    title,
    description: 'Smoke test listing',
    price,
    currency: 'BHD',
    locationGovernorate: 'Capital',
    locationArea: 'Manama',
    contactPreference: 'CALL',
  };
}

function carDetailsPayload() {
  return {
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    transmission: 'AUTO',
    fuel: 'PETROL',
    condition: 'USED',
    color: 'White',
    engineSize: '2.5L',
  };
}

async function exerciseIndividualListingFlow() {
  const creditsBefore = await getJson('/packages/my-credits', state.individualToken);
  const badCreditsBefore = creditsBefore[0];

  state.badListing = await postJson('/listings', carCreatePayload('Bad Smoke Listing', 1234), state.individualToken);
  let failedSubmit = null;
  try {
    await postJson(`/listings/${state.badListing.id}/submit`, {}, state.individualToken);
  } catch (error) {
    failedSubmit = {
      status: error.status,
      body: error.body,
    };
  }

  if (!failedSubmit) {
    throw new Error('Expected invalid listing submission to fail, but it succeeded.');
  }

  const creditsAfterFailedSubmit = await getJson('/packages/my-credits', state.individualToken);
  const badCreditsAfter = creditsAfterFailedSubmit[0] || null;

  state.individualListing = await postJson(
    '/listings',
    carCreatePayload(`Individual Smoke Listing ${runId}`, 4321),
    state.individualToken,
  );

  await postJson(
    `/listings/${state.individualListing.id}/details/car`,
    carDetailsPayload(),
    state.individualToken,
  );

  const submitted = await postJson(
    `/listings/${state.individualListing.id}/submit`,
    {},
    state.individualToken,
  );

  await postJson(
    `/admin/moderation/listings/${state.individualListing.id}/approve`,
    {},
    state.adminToken,
  );

  const myListing = await getJson(`/listings/my/${state.individualListing.id}`, state.individualToken);
  const publicListing = await getJson(`/listings/${state.individualListing.id}`);

  return {
    failedSubmitStatus: failedSubmit.status,
    failedSubmitErrors: failedSubmit.body && failedSubmit.body.errors ? failedSubmit.body.errors : failedSubmit.body,
    creditsBeforeFailedSubmit: badCreditsBefore
      ? badCreditsBefore.creditsTotal - badCreditsBefore.creditsUsed
      : null,
    creditsAfterFailedSubmit: badCreditsAfter
      ? badCreditsAfter.creditsTotal - badCreditsAfter.creditsUsed
      : 0,
    validSubmissionStatus: submitted.status,
    approvedStatus: myListing.status,
    publicStatus: publicListing.status,
  };
}

async function exerciseShowroomListingAndCustomerFlow() {
  state.showroomListing = await postJson(
    '/listings',
    carCreatePayload(`Showroom Smoke Listing ${runId}`, 9876),
    state.showroomToken,
  );

  await postJson(
    `/listings/${state.showroomListing.id}/details/car`,
    carDetailsPayload(),
    state.showroomToken,
  );

  await postJson(`/listings/${state.showroomListing.id}/submit`, {}, state.showroomToken);
  await postJson(`/admin/moderation/listings/${state.showroomListing.id}/approve`, {}, state.adminToken);

  const favoriteBefore = await getJson(
    `/listings/${state.showroomListing.id}/favorite-status`,
    state.individualToken,
  );
  await postJson(`/listings/${state.showroomListing.id}/favorite`, {}, state.individualToken);
  const favoriteAfter = await getJson(
    `/listings/${state.showroomListing.id}/favorite-status`,
    state.individualToken,
  );
  const myFavorites = await getJson('/listings/favorites', state.individualToken);

  state.chatThread = await postJson(
    '/chats/start',
    { listingId: state.showroomListing.id },
    state.individualToken,
  );

  await postJson(
    `/chats/${state.chatThread.id}/messages`,
    { text: 'Is this car still available?' },
    state.individualToken,
  );
  await postJson(
    `/chats/${state.chatThread.id}/messages`,
    { text: 'Yes, it is available.' },
    state.showroomToken,
  );

  const showroomChats = await getJson('/chats', state.showroomToken);
  const individualMessages = await getJson(`/chats/${state.chatThread.id}/messages`, state.individualToken);
  await postJson(`/chats/${state.chatThread.id}/read`, {}, state.individualToken);

  const publicProfile = await getJson(`/users/${state.showroomUser.id}/public`);
  const sold = await postJson(`/listings/${state.showroomListing.id}/mark-sold`, {}, state.showroomToken);
  await deleteJson(`/listings/${state.showroomListing.id}/favorite`, state.individualToken);
  const favoriteAfterRemoval = await getJson(
    `/listings/${state.showroomListing.id}/favorite-status`,
    state.individualToken,
  );

  return {
    favoriteBefore,
    favoriteAfter,
    favoritesCount: Array.isArray(myFavorites.data) ? myFavorites.data.length : myFavorites.length,
    chatThreadId: state.chatThread.id,
    showroomChatCount: showroomChats.length,
    messageCount: Array.isArray(individualMessages.items) ? individualMessages.items.length : 0,
    showroomPublicName:
      publicProfile.showroomProfile && publicProfile.showroomProfile.showroomName
        ? publicProfile.showroomProfile.showroomName
        : null,
    soldStatus: sold.status,
    favoriteAfterRemoval,
  };
}

async function exerciseVideoStoryFlow() {
  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error(`Video fixture not found at ${VIDEO_PATH}`);
  }

  const form = new FormData();
  const videoBuffer = fs.readFileSync(VIDEO_PATH);
  form.append('mediaType', 'VIDEO');
  form.append('duration', '5');
  form.append('file', new Blob([videoBuffer], { type: 'video/mp4' }), 'smoke-video.mp4');

  state.story = await apiFetch('POST', '/stories', {
    token: state.showroomToken,
    body: form,
  });

  await patchJson(`/admin/stories/${state.story.id}/approve`, {}, state.adminToken);
  await postJson(`/stories/${state.story.id}/view`, {}, state.showroomToken);
  const likeResult = await postJson(`/stories/${state.story.id}/like`, {}, state.showroomToken);
  state.storyComment = await postJson(
    `/stories/${state.story.id}/comments`,
    { text: 'Nice story video' },
    state.showroomToken,
  );
  await patchJson(`/admin/stories/comments/${state.storyComment.id}/approve`, {}, state.adminToken);
  const comments = await getJson(`/stories/${state.story.id}/comments`);
  const feed = await getJson('/stories/feed', state.showroomToken);

  return {
    storyStatus: state.story.status,
    likeResult,
    commentId: state.storyComment.id,
    approvedCommentsCount: comments.length,
    feedGroups: feed.length,
  };
}

async function main() {
  console.log(JSON.stringify({ baseUrl: BASE_URL, apiBase: API_BASE, runId }, null, 2));

  await record('Admin login works', loginAdmin);
  await record('Individual and showroom register with immediate access tokens', registerUsers);
  await record('Admin can create test packages', createPackages);
  await record('Payment proof review activates credits and showroom subscription', activatePackagesThroughPayments);
  await record('Individual listing flow works and detects failed submit credit behavior', exerciseIndividualListingFlow);
  await record('Showroom listing, favorites, chat, public profile, and sold flow work', exerciseShowroomListingAndCustomerFlow);
  await record('Video story upload, approval, likes, comments, and feed work', exerciseVideoStoryFlow);

  const failed = results.filter((item) => !item.ok);
  const summary = {
    runId,
    apiBase: API_BASE,
    passed: results.filter((item) => item.ok).length,
    failed: failed.length,
    failures: failed.map((item) => item.name),
    notes: {
      potentialCreditBug:
        results.find((item) => item.name === 'Individual listing flow works and detects failed submit credit behavior') || null,
    },
  };

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));

  console.log('SMOKE_SUMMARY_START');
  console.log(JSON.stringify(summary, null, 2));
  console.log('SMOKE_SUMMARY_END');

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  console.error('FATAL_SMOKE_ERROR');
  console.error(error);
  process.exitCode = 1;
});
