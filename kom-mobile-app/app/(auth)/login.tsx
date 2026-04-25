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
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import SocialAuthSection, { SocialAuthProviderPayload } from '@/components/auth/SocialAuthSection';
import { useAppTranslation, useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

function getAuthErrorDetails(error: any, t: (key: string) => string): { code?: string; message: string } {
  const responseData = error?.response?.data;
  const code = responseData?.error?.code;
  const rawMessage = responseData?.error?.message
    || responseData?.message
    || error?.message
    || '';

  const normalizedMessage = Array.isArray(rawMessage) ? rawMessage[0] : String(rawMessage).trim();

  switch (code) {
    case 'ACCOUNT_RECOVERY_REQUIRED':
      return {
        code,
        message: normalizedMessage || t('auth.accountDeletedTemporary'),
      };
    case 'FORBIDDEN':
      if (/not active/i.test(normalizedMessage)) {
        return {
          code,
          message: t('auth.accountNotActive'),
        };
      }

      if (/banned/i.test(normalizedMessage)) {
        return {
          code,
          message: t('auth.accountBanned'),
        };
      }

      return {
        code,
        message: normalizedMessage || t('auth.forbiddenGeneric'),
      };
    case 'UNAUTHORIZED':
      return {
        code,
        message: t('auth.invalidCredentials'),
      };
    default:
      return {
        code,
        message: normalizedMessage || t('auth.loginFailed'),
      };
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, restoreDeletedAccount, socialAuth, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();

  const handleLogin = async () => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password;

    if (!normalizedEmail || !normalizedPassword) {
      setLoginError(t('auth.enterCredentials'));
      Alert.alert(t('common.warning'), t('auth.enterCredentials'));
      return;
    }

    setLoginError('');

    try {
      await login(normalizedEmail, normalizedPassword);
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } catch (error: any) {
      const { code: errorCode, message } = getAuthErrorDetails(error, t as any);
      if (errorCode === 'ACCOUNT_RECOVERY_REQUIRED') {
        setLoginError(message);
        Alert.alert(t('auth.accountRecoveryTitle'), message, [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('auth.restoreAccount'),
            onPress: async () => {
              try {
                await restoreDeletedAccount(normalizedEmail, normalizedPassword);
                router.replace('/(tabs)');
              } catch (restoreError: any) {
                const restoreMsg = getAuthErrorDetails(restoreError, t as any).message;
                Alert.alert(t('common.error'), restoreMsg || t('auth.restoreAccountFailed'));
              }
            },
          },
        ]);
        return;
      }

      setLoginError(message);
      Alert.alert(t('common.error'), message);
    }
  };

  const handleSocialAuth = async ({ provider, idToken, fullName }: SocialAuthProviderPayload) => {
    await socialAuth({ provider, idToken, fullName });
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const inputBg     = isDark ? '#1E2A40' : '#F8FAFC';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const labelColor  = isDark ? '#F8FAFC' : '#0A0B14';
  const inputColor  = isDark ? '#F8FAFC' : '#0A0B14';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[s.root, { backgroundColor: isDark ? '#0B0F1E' : '#F2F5FC' }]}>
      <StatusBar style="light" />

      {/* ?? Full-bleed navy hero ?? */}
      <LinearGradient colors={['#0A0F1E', '#0E1830', '#162444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        {/* Decorative blobs */}
        <View style={s.blob1} />
        <View style={s.blob2} />

        {/* Back button */}
        <TouchableOpacity
          style={[s.backBtn, { top: insets.top + 12 }, isRTL ? s.backBtnEnd : s.backBtnStart]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Logo + title */}
        <View style={s.heroContent}>
          <Image source={require('../../assets/images/logo.png')} style={s.logo} contentFit="contain" />
          <Text style={s.heroTitle}>{t('auth.login')}</Text>
          <Text style={s.heroSub}>{t('auth.loginSubtitle')}</Text>
        </View>
      </LinearGradient>

      {/* ?? Form card ?? */}
      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.card, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
          {/* Email */}
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
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.password')}</Text>
            <View style={[s.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: inputBg, borderColor: inputBorder }, passFocused && s.inputWrapFocused]}>
              <Ionicons name="lock-closed" size={18} color={passFocused ? '#D4AF37' : '#94A3B8'} style={s.icon} />
              <TextInput
                style={[s.input, { color: inputColor, textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ paddingHorizontal: 8 }}>
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={18} color={passFocused ? '#D4AF37' : '#94A3B8'} />
              </TouchableOpacity>
            </View>
          </View>

          {loginError ? (
            <View style={[s.errorBox, { flexDirection: 'row' }]}>
              <Ionicons name="alert-circle" size={18} color="#B42318" style={s.errorIcon} />
              <Text style={[s.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{loginError}</Text>
            </View>
          ) : null}

          {/* Forgot password */}
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={[s.forgotRow, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[s.forgotText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.forgotQuestion')}</Text>
          </TouchableOpacity>

          {/* Login CTA */}
          <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient colors={['#17285f', '#D4AF37', '#A8860E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.loginGrad}>
              {isLoading ? (
                <ActivityIndicator color="#0A0B14" />
              ) : (
                <Text style={s.loginText}>{t('auth.loginButton')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <SocialAuthSection mode="login" disabled={isLoading} onAuthenticate={handleSocialAuth} />

          {/* Register link */}
          <View style={[s.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={s.footerNote}>{t('auth.noAccount')}</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={s.registerLink}>{t('auth.createNewAccount')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        <AdsBanner />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // hero
  hero: {
    paddingTop: 0,
    paddingBottom: 48,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
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
  heroContent: { paddingTop: 70, width: '100%', alignItems: 'center' },
  logo: { width: 110, height: 42, marginBottom: 20 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, width: '100%', textAlign: 'center' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', width: '100%', textAlign: 'center' },

  // scroll + card
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, marginTop: 24 },
  card: {
    borderRadius: 28,
    padding: 24,
    paddingTop: 28,
    ...Platform.select({
      default: { shadowColor: '#1A2050', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 10 },
    }),
  },

  // inputs
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrap: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  inputWrapFocused: { borderColor: '#D4AF37', backgroundColor: '#101b50' },
  icon: { marginStart: 8 },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
  },
  errorBox: {
    alignItems: 'flex-start',
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: -6,
    marginBottom: 14,
  },
  errorIcon: {
    marginStart: 8,
    marginTop: 1,
  },
  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 13,
    lineHeight: 20,
  },

  // forgot
  forgotRow: { marginTop: -8, marginBottom: 20 },
  forgotText: { color: '#D4AF37', fontSize: 13, fontWeight: '600' },

  // login btn
  loginBtn: {
    borderRadius: 28, overflow: 'hidden', marginBottom: 24,
    ...Platform.select({
      default: { shadowColor: '#C9A227', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
    }),
  },
  loginGrad: { paddingVertical: 17, alignItems: 'center' },
  loginText: { color: '#0A0B14', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  // footer
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  footerNote: { color: '#64748B', fontSize: 14 },
  registerLink: { color: '#D4AF37', fontSize: 14, fontWeight: '800' },
});


