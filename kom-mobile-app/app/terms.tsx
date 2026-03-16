import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function TermsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#0f172a' : '#fff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#e5e7eb' : '#0f172a',
    body: isDark ? '#cbd5e1' : '#334155',
    muted: isDark ? '#94a3b8' : '#94a3b8',
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>الشروط والأحكام</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, { color: theme.text }]}>شروط وأحكام تطبيق ملك السوق (KOM)</Text>

          <Text style={[styles.paragraph, { color: theme.body }]}>
            باستخدامك لتطبيق ملك السوق (KOM)، فإنك توافق على الشروط والأحكام التالية. يرجى قراءتها بعناية قبل استخدام التطبيق.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. قبول الشروط</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>
            باستخدام التطبيق، تؤكد أنك قد قرأت وفهمت ووافقت على هذه الشروط. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام التطبيق.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>2. وصف الخدمة</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>
            تطبيق ملك السوق (KOM) هو منصة إلكترونية لإعلانات بيع وشراء السيارات في البحرين. يتيح التطبيق للأفراد والمعارض نشر إعلاناتهم والتواصل مع المشترين المحتملين.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>3. التسجيل والحساب</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• يجب أن تكون بياناتك صحيحة ومحدثة عند التسجيل.</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• أنت مسؤول عن الحفاظ على سرية كلمة المرور الخاصة بك.</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• يحق للإدارة رفض أو إيقاف أي حساب يخالف هذه الشروط.</Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>4. قواعد نشر الإعلانات</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• يجب أن تكون جميع المعلومات الواردة في الإعلان صحيحة ودقيقة.</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• يُحظر نشر إعلانات مضللة أو احتيالية.</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• يُحظر نشر محتوى مسيء أو غير لائق.</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• يحق للإدارة رفض أو حذف أي إعلان يخالف هذه القواعد.</Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>5. المسؤولية</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>
            تطبيق ملك السوق هو منصة وسيطة فقط، ولا يتحمل مسؤولية أي صفقة تتم بين البائع والمشتري. جميع المعاملات هي على مسؤولية الأطراف المعنية.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>6. الملكية الفكرية</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>
            جميع حقوق الملكية الفكرية المتعلقة بالتطبيق محفوظة لشركة ملك السوق. لا يجوز نسخ أو توزيع أي محتوى من التطبيق دون إذن مسبق.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>7. إنهاء الخدمة</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>
            يحق لنا إنهاء أو تعليق حسابك في أي وقت في حال مخالفة هذه الشروط، دون الحاجة إلى إشعار مسبق.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>8. التعديلات</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>
            نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر التطبيق.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>9. التواصل معنا</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>لأي استفسارات، تواصل معنا عبر:</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• البريد الإلكتروني: support@kotm.app</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• الموقع: https://kotm.app</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'flex-end',
    width: '100%',
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'flex-end',
    alignSelf: 'stretch',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'right',
    width: '100%',
    alignSelf: 'stretch',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 6,
    width: '100%',
    alignSelf: 'stretch',
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    width: '100%',
    alignSelf: 'stretch',
  },
});
