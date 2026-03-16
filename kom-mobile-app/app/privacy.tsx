import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { rtlStyles } from '@/lib/rtl';

export default function PrivacyScreen() {
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>سياسة الخصوصية</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, { color: theme.text }]}>تطبيق ملك السوق (KOM)</Text>

          <Text style={[styles.paragraph, { color: theme.body }]}>
            نحن في تطبيق ملك السوق (KOM) نحرص على حماية خصوصية مستخدمينا واحترام بياناتهم الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية المعلومات عند استخدامك للتطبيق.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. المعلومات التي نقوم بجمعها</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>قد نقوم بجمع المعلومات التالية عند استخدام التطبيق:</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• الاسم</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• البريد الإلكتروني</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• رقم الهاتف (إن وُجد)</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• نوع الحساب (فرد أو معرض)</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• بيانات الإعلانات (السيارات، الصور، الفيديوهات، الأسعار)</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• معلومات تقنية أساسية لتحسين أداء التطبيق</Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>2. كيفية استخدام المعلومات</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>نستخدم المعلومات التي نجمعها للأغراض التالية:</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• إنشاء وإدارة حساب المستخدم</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• نشر وعرض الإعلانات داخل التطبيق</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• تمكين التواصل بين البائعين والمشترين</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• مراجعة الإعلانات من قبل الإدارة</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• تحسين تجربة المستخدم وجودة الخدمة</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• إرسال إشعارات متعلقة بحالة الإعلانات (قبول / رفض)</Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>3. مشاركة المعلومات</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• لا نقوم ببيع أو مشاركة بياناتك الشخصية مع أي طرف ثالث.</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• قد يتم عرض بعض المعلومات (مثل اسم البائع أو تفاصيل الإعلان) بشكل علني داخل التطبيق لغرض إتمام عمليات البيع والشراء.</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• يتم الوصول إلى البيانات الحساسة فقط من قبل إدارة التطبيق عند الحاجة.</Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>4. حماية البيانات</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>نلتزم باتخاذ الإجراءات التقنية والتنظيمية المناسبة لحماية بيانات المستخدمين من:</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• الوصول غير المصرح به</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• التعديل أو الإفشاء غير المشروع</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• الفقدان أو التلف</Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>5. ملفات الوسائط (الصور والفيديو)</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• الصور والفيديوهات التي يرفعها المستخدمون تُستخدم فقط لعرض الإعلانات.</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• يتحمل المستخدم مسؤولية المحتوى الذي يقوم برفعه، ويجب ألا يخالف القوانين أو حقوق الآخرين.</Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>6. حذف الحساب والبيانات</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>يمكن للمستخدم طلب حذف حسابه وبياناته من خلال التواصل مع إدارة التطبيق، وسيتم التعامل مع الطلب وفق الإجراءات المعتمدة.</Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>7. التعديلات على سياسة الخصوصية</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم نشر أي تعديل داخل التطبيق، ويُعتبر استمرار استخدامك للتطبيق موافقة على التحديثات.</Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>8. الموافقة</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>باستخدامك لتطبيق ملك السوق (KOM)، فإنك توافق على سياسة الخصوصية هذه.</Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>9. التواصل معنا</Text>
          <Text style={[styles.paragraph, { color: theme.body }]}>في حال وجود أي استفسارات أو ملاحظات بخصوص سياسة الخصوصية، يمكنك التواصل معنا عبر:</Text>
          <Text style={[styles.bullet, { color: theme.body }]}>• البريد الإلكتروني: support@kotm.app</Text>
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
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'right',
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'right',
    width: '100%',
    alignSelf: 'stretch',
  },
  paragraph: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 6,
    width: '100%',
    alignSelf: 'stretch',
  },
  bullet: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    textAlign: 'right',
    width: '100%',
    alignSelf: 'stretch',
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    width: '100%',
    alignSelf: 'stretch',
  },
});