import React, { useState } from 'react';
import AdsBanner from '@/components/ads/AdsBanner';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTranslation, useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();

  const inputBg     = isDark ? '#1E2A40' : '#F8FAFC';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const labelColor  = isDark ? '#F8FAFC' : '#0A0B14';
  const inputColor  = isDark ? '#F8FAFC' : '#0A0B14';
  const cardBg      = isDark ? '#111827' : '#FFFFFF';
  const mutedColor  = isDark ? '#94A3B8' : '#64748B';

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert(t('common.error'), t('auth.forgotInvalidEmail'));
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setIsLoading(false);
      setEmailSent(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[s.root, { backgroundColor: isDark ? '#0B0F1E' : '#F2F5FC' }]}
    >
      <StatusBar style="light" />

      {/* Hero */}
      <LinearGradient
        colors={['#0A0F1E', '#0E1830', '#162444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View style={s.blob1} />
        <View style={s.blob2} />

        <TouchableOpacity
          style={[s.backBtn, { top: insets.top + 12 }, isRTL ? s.backBtnEnd : s.backBtnStart]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={[s.heroContent, isRTL ? s.heroContentRtl : s.heroContentLtr]}>
          <Image source={require('../../assets/images/logo.png')} style={s.logo} contentFit="contain" />
          <Text style={[s.heroTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.forgotTitle')}</Text>
          <Text style={[s.heroSub, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.forgotSubtitle')}</Text>
        </View>
      </LinearGradient>

      {/* Card */}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.card, { backgroundColor: cardBg }]}>

          {!emailSent ? (
            <>
              <View style={s.inputGroup}>
                <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.email')}</Text>
                <View style={[s.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: inputBg, borderColor: inputBorder }, emailFocused && s.inputWrapFocused]}>
                  <Ionicons name="mail" size={18} color={emailFocused ? '#D4AF37' : '#94A3B8'} style={s.icon} />
                  <TextInput
                    style={[s.input, { color: inputColor, textAlign: isRTL ? 'right' : 'left' }]}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                                        onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
                <LinearGradient colors={['#4a67e8', '#D4AF37', '#A8860E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                  {isLoading ? (
                    <ActivityIndicator color="#0A0B14" />
                  ) : (
                    <Text style={s.submitText}>{t('auth.sendRecoveryLink')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.successBox}>
              <LinearGradient colors={['#10B981', '#059669']} style={s.successIcon}>
                <Ionicons name="checkmark" size={36} color="#fff" />
              </LinearGradient>
              <Text style={[s.successTitle, { color: labelColor }]}>{t('auth.forgotSentTitle')}</Text>
              <Text style={[s.successSub, { color: mutedColor}]}>
                {t('auth.forgotSentMessage')}
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={s.backToLogin}>
            <Text style={s.backToLoginText}>{t('auth.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
        <AdsBanner />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  hero: { paddingTop: 0, paddingBottom: 48, paddingHorizontal: 24, overflow: 'hidden', position: 'relative', zIndex: 0 },
  blob1: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(212,175,55,0.07)', top: -80, right: -60 },
  blob2: { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(212,175,55,0.05)', bottom: -20, left: -50 },
  backBtn: {
    position: 'absolute', zIndex: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  backBtnStart: { left: 20 },
  backBtnEnd: { right: 20 },
  heroContent: { paddingTop: 70, width: '100%' },
  heroContentRtl: { alignItems: 'flex-end' },
  heroContentLtr: { alignItems: 'flex-start' },
  logo: { width: 110, height: 42, marginBottom: 20 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, width: '100%' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', width: '100%' },

  scrollView: { zIndex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, marginTop: 24 },
  card: {
    borderRadius: 28, padding: 24, paddingTop: 28,
    ...Platform.select({
      default: { shadowColor: '#1A2050', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 10 },
    }),
  },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrap: {
    alignItems: 'center',
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 2,
  },
  inputWrapFocused: { borderColor: '#D4AF37', backgroundColor: '#0e1a4e' },
  icon: { marginStart: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15 },

  submitBtn: {
    borderRadius: 28, overflow: 'hidden', marginBottom: 16,
    ...Platform.select({
      default: { shadowColor: '#C9A227', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
    }),
  },
  submitGrad: { paddingVertical: 17, alignItems: 'center' },
  submitText: { color: '#0A0B14', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  successBox: { alignItems: 'center', paddingVertical: 24 },
  successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  successSub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 8 },

  backToLogin: { alignItems: 'center', paddingVertical: 8 },
  backToLoginText: { color: '#D4AF37', fontSize: 14, fontWeight: '700' },
});
