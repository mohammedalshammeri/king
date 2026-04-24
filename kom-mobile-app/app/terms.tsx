import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useAppTranslation, useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';

export default function TermsScreen() {
  const router = useRouter();
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#0f172a' : '#fff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#e5e7eb' : '#0f172a',
    body: isDark ? '#cbd5e1' : '#334155',
  };
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <PageHeader
        title={t('terms.pageTitle')}
        backgroundColor={theme.background}
        borderColor={theme.border}
        textColor={theme.text}
        variant="light"
        onBack={() => router.replace('/(tabs)/settings')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, { color: theme.text, textAlign}]}>{t('terms.heading')}</Text>

          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('terms.intro')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('terms.acceptTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('terms.acceptBody')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('terms.serviceTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('terms.serviceBody')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('terms.accountTitle')}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('terms.accountBullet1')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('terms.accountBullet2')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('terms.accountBullet3')}`}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('terms.listingsTitle')}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('terms.listingsBullet1')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('terms.listingsBullet2')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('terms.listingsBullet3')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('terms.listingsBullet4')}`}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('terms.liabilityTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('terms.liabilityBody')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('terms.ipTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('terms.ipBody')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('terms.terminationTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('terms.terminationBody')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('terms.changesTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('terms.changesBody')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('terms.contactTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('terms.contactIntro')}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('terms.email')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('terms.website')}`}</Text>
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
  content: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'stretch',
    width: '100%',
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'stretch',
    alignSelf: 'stretch',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    width: '100%',
    alignSelf: 'stretch',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
    width: '100%',
    alignSelf: 'stretch',
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    width: '100%',
    alignSelf: 'stretch',
  },
});
