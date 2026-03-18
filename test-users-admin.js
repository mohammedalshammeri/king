// Test script to check admin users API
const axios = require('axios');

const BASE_URL = 'https://api.kotm.app/api/v1';

async function testAdminLogin() {
  console.log('🔐 Testing admin login...\n');
  
  // Replace with your admin credentials
  const credentials = {
    phoneNumber: '+97333123456',  // Replace with actual admin phone
    password: 'admin123'           // Replace with actual admin password
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    const { access_token } = response.data.data;
    
    console.log('✅ Login successful');
    console.log('🔑 Token:', access_token.substring(0, 20) + '...\n');
    
    return access_token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetUsers(token) {
  console.log('👥 Fetching all users...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const users = response.data.data;
    console.log(`✅ Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No Name'} - ${user.phoneNumber}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   City: ${user.city || 'N/A'}`);
      console.log(`   Merchant: ${user.merchantType || 'N/A'}`);
      console.log('');
    });
    
    return users;
  } catch (error) {
    console.error('❌ Failed to get users:', error.response?.data || error.message);
    return [];
  }
}

async function testDatabaseDirectly() {
  console.log('📊 Testing user count directly...\n');
  
  try {
    // This endpoint should work without auth
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend is accessible:', response.data);
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 KOM Admin Users Debug Test');
  console.log('='.repeat(60) + '\n');
  
  // Test 1: Check backend health
  await testDatabaseDirectly();
  console.log('\n' + '-'.repeat(60) + '\n');
  
  // Test 2: Try to login as admin
  const token = await testAdminLogin();
  
  if (!token) {
    console.log('\n⚠️  Cannot proceed without valid admin token');
    console.log('Please update the script with correct admin credentials\n');
    return;
  }
  
  console.log('-'.repeat(60) + '\n');
  
  // Test 3: Get all users
  const users = await testGetUsers(token);
  
  console.log('='.repeat(60));
  console.log(`\n📝 Summary: ${users.length} users found in database\n`);
  
  if (users.length === 0) {
    console.log('💡 Possible reasons:');
    console.log('   1. No users have registered yet');
    console.log('   2. Database is empty');
    console.log('   3. Migration issue\n');
  }
}

main().catch(console.error);
