import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/context/LanguageContext';

type PageHeaderProps = {
  title: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  rightSlot?: React.ReactNode;
  showBack?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  onBack?: () => void;
  /** 'gradient' = dark navy (default), 'light' = white card style */
  variant?: 'gradient' | 'light';
};

export function PageHeader({
  title,
  backgroundColor,
  borderColor,
  textColor,
  rightSlot,
  showBack = true,
  containerStyle,
  titleStyle,
  onBack,
  variant = 'gradient',
}: PageHeaderProps) {
  const router = useRouter();
  const { isRTL } = useLanguage();

  const isLight = variant === 'light';

  // Gradient variant: always dark navy + gold text regardless of theme
  const gradientTextColor = '#D4AF37';
  const resolvedTextColor = textColor ?? (isLight ? '#0A0B14' : gradientTextColor);

  // Back circle styles based on variant (gradient is always navy bg → gold circle)
  const backCircleStyle = isLight
    ? styles.backCircleLight
    : styles.backCircleLightModeNavy; // always on navy bg → semi-transparent gold

  const backButton = showBack ? (
    <TouchableOpacity
      onPress={() => (onBack ? onBack() : router.back())}
      style={styles.backBtn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={[styles.backCircle, backCircleStyle]}>
        <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={resolvedTextColor} />
      </View>
    </TouchableOpacity>
  ) : (
    <View style={styles.backBtnPlaceholder} />
  );

  const content = (
    <>
      {backButton}
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: resolvedTextColor}, titleStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {title}
        </Text>
      </View>
      <View style={styles.rightSlot}>{rightSlot}</View>
    </>
  );

  if (isLight) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: backgroundColor ?? '#FFFFFF', borderBottomColor: borderColor ?? '#E4EAF4' },
          containerStyle,
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0E1830', '#162444']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.container, styles.gradientContainer, containerStyle]}
    >
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 16,
    borderBottomWidth: 0,
    minHeight: 68,
  },
  gradientContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    start: 16,
    width: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    zIndex: 2,
  },
  backBtnPlaceholder: {
    position: 'absolute',
    top: 16,
    end: 16,
    width: 44,
    minWidth: 44,
    height: 44,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backCircleLight: {
    backgroundColor: '#F0F4FC',
  },
  backCircleLightModeNavy: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  backCircleDarkModeGold: {
    backgroundColor: 'rgba(14,24,48,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(14,24,48,0.3)',
  },
  titleWrap: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 56,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    width: '100%',
    flexShrink: 1,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  rightSlot: {
    position: 'absolute',
    top: 16,
    end: 16,
    minWidth: 44,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});

export default PageHeader;
