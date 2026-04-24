import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useAppTranslation } from '@/context/LanguageContext';
import { Text, View } from '@/components/Themed';
export default function NotFoundScreen() {
  const { t } = useAppTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={[styles.container]}>
        <Text style={[styles.title, { textAlign: 'auto'}]}>{t('notFound.message')}</Text>

        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { textAlign: 'auto'}]}>{t('notFound.backHome')}</Text>
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
  },
});
