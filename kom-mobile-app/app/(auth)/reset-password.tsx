import React, { useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTranslation, useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

function getResetPasswordErrorMessage(error: any, t: (key: string) => string): string {
  const responseData = error?.response?.data;
  const rawMessage = responseData?.error?.message
    || responseData?.message
    || error?.message
    || '';

  const normalizedMessage = Array.isArray(rawMessage) ? rawMessage[0] : String(rawMessage).trim();

  if (/invalid|expired/i.test(normalizedMessage)) {
    return t('auth.resetInvalidOrExpired');
  }

  return normalizedMessage || t('auth.resetUnavailable');
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassFocused, setNewPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();

  const inputBg     = isDark ? '#1E2A40' : '#F8FAFC';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const labelColor  = isDark ? '#F8FAFC' : '#0A0B14';
  const inputColor  = isDark ? '#F8FAFC' : '#0A0B14';
  const cardBg      = isDark ? '#111827' : '#FFFFFF';
  const mutedColor  = isDark ? '#94A3B8' : '#64748B';
  const reqBg       = isDark ? '#1E2A40' : '#F8FAFC';

  const checks = {
    length:  newPassword.length >= 8,
    upper:   /[A-Z]/.test(newPassword),
    lower:   /[a-z]/.test(newPassword),
    digit:   /\d/.test(newPassword),
    special: /[@$!%*?&]/.test(newPassword),
  };

  const handleSubmit = async () => {
    if (!checks.length) {
      Alert.alert(t('common.error'), t('auth.passwordMinLength'));
      return;
    }
    if (!checks.upper || !checks.lower || !checks.digit || !checks.special) {
      Alert.alert(t('common.error'), t('auth.passwordComplexity'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsMismatch'));
      return;
    }
    if (!params.token) {
      Alert.alert(t('common.error'), t('auth.tokenMissing'));
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token: params.token, newPassword });
      Alert.alert(t('auth.resetSuccessTitle'), t('auth.resetSuccessMessage'), [
        { text: t('auth.loginAfterReset'), onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      Alert.alert(t('common.error'), getResetPasswordErrorMessage(error, t as any));
    } finally {
      setIsLoading(false);
    }
  };

  const CheckRow = ({ ok, label }: { ok: boolean; label: string }) => (
    <View style={[s.reqRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={ok ? '#10B981' : '#9CA3AF'}
      />
      <Text style={[s.reqText, { color: mutedColor, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{label}</Text>
    </View>
  );

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
          style={[s.backBtn, isRTL ? s.backBtnRtl : s.backBtnLtr, { top: insets.top + 12 }]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={[s.heroContent, isRTL ? s.heroContentRtl : s.heroContentLtr]}>
          <Image source={require('../../assets/images/logo.png')} style={s.logo} contentFit="contain" />
          <Text style={[s.heroTitle, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('auth.resetPassword')}</Text>
          <Text style={[s.heroSub, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('auth.resetSubtitle')}</Text>
        </View>
      </LinearGradient>

      {/* Form card */}
      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.card, { backgroundColor: cardBg }]}>

          {/* New password */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.newPassword')}</Text>
            <View style={[s.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: inputBg, borderColor: inputBorder }, newPassFocused && s.inputWrapFocused]}>
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.icon}>
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={18} color={newPassFocused ? '#D4AF37' : '#94A3B8'} />
              </TouchableOpacity>
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textAlign={isRTL ? 'right' : 'left'}
                writingDirection={isRTL ? 'rtl' : 'ltr'}
                onFocus={() => setNewPassFocused(true)}
                onBlur={() => setNewPassFocused(false)}
              />
              <Ionicons name="lock-closed" size={18} color={newPassFocused ? '#D4AF37' : '#94A3B8'} style={{ marginEnd: 4 }} />
            </View>
          </View>

          {/* Confirm password */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.confirmPassword')}</Text>
            <View style={[s.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: inputBg, borderColor: inputBorder }, confirmFocused && s.inputWrapFocused]}>
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={s.icon}>
                <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={18} color={confirmFocused ? '#D4AF37' : '#94A3B8'} />
              </TouchableOpacity>
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                textAlign={isRTL ? 'right' : 'left'}
                writingDirection={isRTL ? 'rtl' : 'ltr'}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
              />
              <Ionicons name="lock-closed" size={18} color={confirmFocused ? '#D4AF37' : '#94A3B8'} style={{ marginEnd: 4 }} />
            </View>
          </View>

          {/* Requirements */}
          <View style={[s.reqBox, { backgroundColor: reqBg }]}>
            <Text style={[s.reqTitle, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.passwordRequirements')}</Text>
            <CheckRow ok={checks.length}  label={t('auth.passwordReqLength')} />
            <CheckRow ok={checks.upper}   label={t('auth.passwordReqUpper')} />
            <CheckRow ok={checks.lower}   label={t('auth.passwordReqLower')} />
            <CheckRow ok={checks.digit}   label={t('auth.passwordReqDigit')} />
            <CheckRow ok={checks.special} label={t('auth.passwordReqSpecial')} />
          </View>

          {/* Submit */}
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient colors={['#E8C84A', '#D4AF37', '#A8860E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
              {isLoading ? (
                <ActivityIndicator color="#0A0B14" />
              ) : (
                <Text style={s.submitText}>{t('auth.resetPasswordButton')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to login */}
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={s.backToLogin}>
            <Text style={s.backToLoginText}>{t('auth.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  hero: { paddingTop: 0, paddingBottom: 48, paddingHorizontal: 24, overflow: 'hidden', position: 'relative' },
  blob1: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(212,175,55,0.07)', top: -80, right: -60 },
  blob2: { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(212,175,55,0.05)', bottom: -20, left: -50 },
  backBtn: {
    position: 'absolute', zIndex: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  backBtnRtl: { right: 20 },
  backBtnLtr: { left: 20 },
  heroContent: { paddingTop: 70, width: '100%' },
  heroContentRtl: { alignItems: 'flex-end' },
  heroContentLtr: { alignItems: 'flex-start' },
  logo: { width: 110, height: 42, marginBottom: 20 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, width: '100%' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', width: '100%' },

  scrollContent: { flexGrow: 1, paddingHorizontal: 16, marginTop: -24 },
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
  inputWrapFocused: { borderColor: '#D4AF37', backgroundColor: '#FFFDF4' },
  icon: { marginStart: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15 },

  reqBox: { borderRadius: 14, padding: 16, marginBottom: 24 },
  reqTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12 },
  reqRow: { alignItems: 'center', gap: 8, marginBottom: 8 },
  reqText: { fontSize: 13, flex: 1 },

  submitBtn: {
    borderRadius: 28, overflow: 'hidden', marginBottom: 16,
    ...Platform.select({
      default: { shadowColor: '#C9A227', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
    }),
  },
  submitGrad: { paddingVertical: 17, alignItems: 'center' },
  submitText: { color: '#0A0B14', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  backToLogin: { alignItems: 'center', paddingVertical: 8 },
  backToLoginText: { color: '#D4AF37', fontSize: 14, fontWeight: '700' },
});
