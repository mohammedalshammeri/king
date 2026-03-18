// Test script to send a push notification
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

async function sendTestNotification() {
  console.log('🔔 اختبار إرسال إشعار Push');
  console.log('='.repeat(60));
  console.log('');
  
  // استبدل هذا بـ push token حقيقي من التطبيق
  const pushToken = 'ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]';
  
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error('❌ Push token غير صالح!');
    console.log('⚠️  يجب أن يبدأ بـ: ExponentPushToken[...]');
    console.log('');
    console.log('📝 كيف تحصل على push token:');
    console.log('   1. افتح التطبيق على جهاز حقيقي');
    console.log('   2. سجل الدخول أو افتح التطبيق كضيف');
    console.log('   3. افحص console logs وابحث عن: "✅ Push token obtained:"');
    console.log('   4. انسخ الـ token واستبدله في هذا السكريبت');
    console.log('');
    return;
  }
  
  const message = {
    to: pushToken,
    sound: 'default',
    title: '🔔 اختبار الإشعار',
    body: 'هذا إشعار تجريبي من King of the Market!',
    data: { screen: '/notifications' },
    priority: 'high',
  };
  
  try {
    console.log('📤 إرسال الإشعار...');
    const tickets = await expo.sendPushNotificationsAsync([message]);
    
    console.log('');
    console.log('✅ تم إرسال الإشعار!');
    console.log('📊 النتيجة:', JSON.stringify(tickets, null, 2));
    console.log('');
    
    if (tickets[0].status === 'error') {
      console.error('❌ حدث خطأ:', tickets[0].message);
      console.log('');
      if (tickets[0].details?.error === 'DeviceNotRegistered') {
        console.log('💡 الجهاز غير مسجل. الأسباب المحتملة:');
        console.log('   - Push token قديم أو غير صالح');
        console.log('   - التطبيق تم إلغاء تثبيته ثم أُعيد تثبيته');
        console.log('   - الجهاز غير push token جديد');
      }
    } else {
      console.log('🎉 نجح! يجب أن يظهر الإشعار على الجهاز الآن.');
      console.log('');
      console.log('💡 ملاحظات:');
      console.log('   - إذا كان التطبيق مفتوحاً، ستظهر الإشعار في foreground');
      console.log('   - إذا كان التطبيق مغلقاً، ستظهر في notification center');
      console.log('   - على iOS، تأكد من تفعيل الإشعارات في Settings');
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ فشل إرسال الإشعار:', error);
    console.log('');
  }
}

console.log('');
sendTestNotification();
