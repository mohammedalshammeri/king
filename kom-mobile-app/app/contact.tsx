import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAppTranslation, useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';
const CONTACT = {
  email: 'support@kotm.app',
  phone: '',
  instagram: '',
  whatsapp: '',
};

export default function ContactScreen() {
  const router = useRouter();
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#0f172a' : '#fff',
    surface: isDark ? '#1f2937' : '#f8fafc',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#e5e7eb' : '#0f172a',
    subText: isDark ? '#cbd5e1' : '#475569',
    muted: isDark ? '#94a3b8' : '#94a3b8',
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error('Failed to open link', e);
    }
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <PageHeader
        title={t('contact.title')}
        backgroundColor={theme.background}
        borderColor={theme.border}
        textColor={theme.text}
        variant="light"
        onBack={() => router.back()}
      />

      <View style={[styles.content]}>
        <TouchableOpacity
          style={[styles.card, { flexDirection: 'row', gap: 12, backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => openLink(`mailto:${CONTACT.email}`)}
        >
          <Ionicons name="mail-outline" size={22} color="#D4AF37" />
          <View style={[styles.cardText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.title, { color: theme.text, textAlign: 'auto'}]}>{t('contact.email')}</Text>
            <Text style={[styles.value, { color: theme.subText, textAlign: 'auto'}]}>{CONTACT.email}</Text>
          </View>
        </TouchableOpacity>

        {!!CONTACT.phone && (
          <TouchableOpacity
            style={[styles.card, { flexDirection: 'row', gap: 12, backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => openLink(`tel:${CONTACT.phone.replace(/\s/g, '')}`)}
          >
            <Ionicons name="call-outline" size={22} color="#D4AF37" />
            <View style={[styles.cardText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.title, { color: theme.text, textAlign: 'auto'}]}>{t('contact.phone')}</Text>
              <Text style={[styles.value, { color: theme.subText, textAlign: 'auto'}]}>{CONTACT.phone}</Text>
            </View>
          </TouchableOpacity>
        )}

        {!!CONTACT.whatsapp && (
          <TouchableOpacity
            style={[styles.card, { flexDirection: 'row', gap: 12, backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => openLink(CONTACT.whatsapp)}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#22c55e" />
            <View style={[styles.cardText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.title, { color: theme.text, textAlign: 'auto'}]}>{t('contact.whatsapp')}</Text>
              <Text style={[styles.value, { color: theme.subText, textAlign: 'auto'}]}>{CONTACT.whatsapp}</Text>
            </View>
          </TouchableOpacity>
        )}

        {!!CONTACT.instagram && (
          <TouchableOpacity
            style={[styles.card, { flexDirection: 'row', gap: 12, backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => openLink(CONTACT.instagram)}
          >
            <Ionicons name="logo-instagram" size={22} color="#ec4899" />
            <View style={[styles.cardText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.title, { color: theme.text, textAlign: 'auto'}]}>{t('contact.instagram')}</Text>
              <Text style={[styles.value, { color: theme.subText, textAlign: 'auto'}]}>{CONTACT.instagram}</Text>
            </View>
          </TouchableOpacity>
        )}

        {!CONTACT.phone && !CONTACT.whatsapp && !CONTACT.instagram && (
          <Text style={[styles.note, { color: theme.muted}]}>{t('contact.emailOnlyNote')}</Text>
        )}
      </View>
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
    gap: 12,
  },
  card: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cardText: {
    flex: 1,
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    width: '100%',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    width: '100%',
  },
  value: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    width: '100%',
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
