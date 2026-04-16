import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { useAppTranslation } from '@/context/LanguageContext';

const LEGACY_REDIRECT_TARGET = '/(tabs)/add' as const;

export default function AddCarScreen() {
  const { t } = useAppTranslation();
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? Colors.dark.background : Colors.background,
    text: isDark ? Colors.dark.text : Colors.text,
    primary: Colors.primary,
  };

  useEffect(() => {
    router.replace(LEGACY_REDIRECT_TARGET);
  }, []);

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={[styles.message, { color: theme.text }]}>{t('addListing.redirectingToUnifiedAdd')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
