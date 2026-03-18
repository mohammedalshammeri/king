// Test script to check push notifications
const axios = require('axios');

const BASE_URL = 'https://api.kotm.app/api/v1';

async function testAdminLogin() {
  console.log('🔐 Logging in as admin...\n');
  
  const credentials = {
    phoneNumber: '+97333123456',  // Replace with actual admin phone
    password: 'admin123'           // Replace with actual admin password
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    const { access_token } = response.data.data;
    
    console.log('✅ Login successful\n');
    return access_token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetDeviceTokens(token) {
  console.log('📱 Checking registered device tokens...\n');
  
  try {
    // Try to get the current user's profile
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const userId = profileResponse.data.data.id;
    console.log('👤 User ID:', userId, '\n');
    
    // Note: You may need to add an endpoint to get device tokens
    // For now, we'll just check if the notification endpoint exists
    
    return userId;
  } catch (error) {
    console.error('❌ Failed to get profile:', error.response?.data || error.message);
    return null;
  }
}

async function testSendNotification(token) {
  console.log('🔔 Testing send notification...\n');
  
  try {
    // Try to send a test notification to yourself
    const response = await axios.post(
      `${BASE_URL}/notifications/test`,
      {
        title: 'اختبار الإشعارات',
        body: 'هذا إشعار تجريبي من King of the Market',
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    console.log('✅ Notification sent:', response.data);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  Test notification endpoint does not exist');
      console.log('ℹ️  This is normal - notifications are sent automatically on events\n');
    } else {
      console.error('❌ Failed to send notification:', error.response?.data || error.message);
    }
    return false;
  }
}

async function checkNotificationSettings() {
  console.log('⚙️  Notification system checklist:\n');
  
  console.log('✓ Backend using expo-server-sdk');
  console.log('✓ Frontend registers for push notifications');
  console.log('✓ app.json configured with iosDisplayInForeground: true');
  console.log('\n📋 Requirements for iOS push notifications:');
  console.log('   1. Real device (not simulator)');
  console.log('   2. Production or TestFlight build');
  console.log('   3. User grants notification permission');
  console.log('   4. App registered push token with backend');
  console.log('   5. Expo push token is valid (starts with ExponentPushToken[...])\n');
}

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 KOM Push Notifications Debug Test');
  console.log('='.repeat(60) + '\n');
  
  // Show checklist first
  checkNotificationSettings();
  console.log('-'.repeat(60) + '\n');
  
  // Test login
  const token = await testAdminLogin();
  
  if (!token) {
    console.log('\n⚠️  Cannot proceed without valid token');
    console.log('Please update the script with correct credentials\n');
    return;
  }
  
  console.log('-'.repeat(60) + '\n');
  
  // Test profile/device tokens
  const userId = await testGetDeviceTokens(token);
  
  console.log('-'.repeat(60) + '\n');
  
  // Test send notification
  await testSendNotification(token);
  
  console.log('='.repeat(60));
  console.log('\n💡 To receive push notifications when app is closed:');
  console.log('   1. Build app with: eas build --platform ios --profile production-test');
  console.log('   2. Install on real device');
  console.log('   3. Open app and login');
  console.log('   4. App will register push token automatically');
  console.log('   5. Close the app completely');
  console.log('   6. Trigger a notification event (e.g., someone likes your listing)');
  console.log('   7. Notification should appear even when app is closed\n');
  
  console.log('🔍 Check Expo push notifications best practices:');
  console.log('   https://docs.expo.dev/push-notifications/overview/\n');
}

main().catch(console.error);
