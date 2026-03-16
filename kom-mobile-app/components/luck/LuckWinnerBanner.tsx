import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface LuckWinnerBannerProps {
  winner: {
    code: string;
    userName: string;
    drawnAt: string;
  };
}

export default function LuckWinnerBanner({ winner }: LuckWinnerBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <LinearGradient
      colors={['#D4AF37', '#C9A227', '#997D2D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <TouchableOpacity style={styles.dismiss} onPress={() => setDismissed(true)}>
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.trophy}>🏆</Text>
        <View style={styles.textBlock}>
          <Text style={styles.title}>الكود الفائز في السحب</Text>
          <Text style={styles.code}>{winner.code}</Text>
          <Text style={styles.name}>الفائز: {winner.userName}</Text>
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
    left: 10,
    padding: 4,
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'flex-end',
  },
  trophy: {
    fontSize: 36,
  },
  textBlock: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 2,
  },
  code: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    textAlign: 'right',
  },
  name: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
    marginTop: 2,
  },
});
