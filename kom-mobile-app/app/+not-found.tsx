import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useAppTranslation, useLanguage } from '@/context/LanguageContext';
import { Text, View } from '@/components/Themed';
export default function NotFoundScreen() {
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={[styles.container]}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('notFound.message')}</Text>

        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('notFound.backHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    width: '100%',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    width: '100%',
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
    textAlign: 'right',
  },
});
