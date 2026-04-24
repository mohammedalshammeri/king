import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useAppTranslation, useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';
export default function PrivacyScreen() {
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
        title={t('privacy.pageTitle')}
        backgroundColor={theme.background}
        borderColor={theme.border}
        textColor={theme.text}
        variant="light"
        onBack={() => router.replace('/(tabs)/settings')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, { color: theme.text, textAlign}]}>{t('privacy.heading')}</Text>

          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('privacy.intro')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('privacy.collectTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('privacy.collectIntro')}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.collectBullet1')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.collectBullet2')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.collectBullet3')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.collectBullet4')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.collectBullet5')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.collectBullet6')}`}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('privacy.useTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('privacy.useIntro')}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.useBullet1')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.useBullet2')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.useBullet3')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.useBullet4')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.useBullet5')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.useBullet6')}`}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('privacy.shareTitle')}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.shareBullet1')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.shareBullet2')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.shareBullet3')}`}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('privacy.protectionTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('privacy.protectionIntro')}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.protectionBullet1')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.protectionBullet2')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.protectionBullet3')}`}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('privacy.mediaTitle')}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.mediaBullet1')}`}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.mediaBullet2')}`}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('privacy.deletionTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('privacy.deletionBody')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('privacy.changesTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('privacy.changesBody')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('privacy.consentTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('privacy.consentBody')}</Text>

          <Text style={[styles.sectionTitle, { color: theme.text, textAlign}]}>{t('privacy.contactTitle')}</Text>
          <Text style={[styles.paragraph, { color: theme.body, textAlign}]}>{t('privacy.contactBody')}</Text>
          <Text style={[styles.bullet, { color: theme.body, textAlign}]}>{`• ${t('privacy.contactEmail')}`}</Text>
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
