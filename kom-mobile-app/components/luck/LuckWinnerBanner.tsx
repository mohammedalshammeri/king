import React, { useState } from 'react';
import { I18nManager, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTranslation } from '@/context/LanguageContext';

interface LuckWinnerBannerProps {
  winner: {
    code: string;
    userName: string;
    drawnAt: string;
  };
}

export default function LuckWinnerBanner({ winner }: LuckWinnerBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useAppTranslation();
  const isRTL = I18nManager.isRTL;

  if (dismissed) return null;

  return (
    <LinearGradient
      colors={['#D4AF37', '#C9A227', '#997D2D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <TouchableOpacity style={[styles.dismiss, isRTL ? styles.dismissStart : styles.dismissEnd]} onPress={() => setDismissed(true)}>
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.trophy}>🏆</Text>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { textAlign: 'auto'}]}>{t('luck.winnerTitle')}</Text>
          <Text style={[styles.code, { textAlign: 'auto' }]}>{winner.code}</Text>
          <Text style={[styles.name, { textAlign: 'auto'}]}>{t('luck.winnerName', { name: winner.userName })}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dismiss: {
    position: 'absolute',
    top: 8,
    padding: 4,
    zIndex: 1,
  },
  dismissStart: { left: 10 },
  dismissEnd: { right: 10 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trophy: {
    fontSize: 36,
  },
  textBlock: { flex: 1 },
  title: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 2,
  },
  code: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  name: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
