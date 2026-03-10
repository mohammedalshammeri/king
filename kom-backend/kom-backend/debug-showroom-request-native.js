async function check() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || 'info@kotm.app';
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!password) {
      throw new Error('Missing SUPER_ADMIN_PASSWORD in environment');
    }

    console.log('Logging in...');
    const loginRes = await fetch('http://127.0.0.1:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
      })
    });

    if (!loginRes.ok) {
        throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    console.log('Logged in. Token received.');

    console.log('Fetching inactive showrooms...');
    // Construct URL with params manually to be safe
    const url = 'http://127.0.0.1:3000/api/v1/admin/users?role=USER_SHOWROOM&isActive=false';
    const usersRes = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!usersRes.ok) {
        throw new Error(`Fetch failed: ${usersRes.status} ${await usersRes.text()}`);
    }

    const usersData = await usersRes.json();
    console.log('Response status:', usersRes.status);
    console.log('Total users found:', usersData.meta?.total);
    console.log('Users data length:', usersData.data?.length);
    console.log('Users data sample:', JSON.stringify(usersData.data?.[0], null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.cause) console.error(error.cause);
  }
}

check();
