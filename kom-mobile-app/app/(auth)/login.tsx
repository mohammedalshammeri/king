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
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, restoreDeletedAccount, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const handleLogin = async () => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    try {
      await login(normalizedEmail, normalizedPassword);
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } catch (error: any) {
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'ACCOUNT_RECOVERY_REQUIRED') {
        const msg = error.response?.data?.error?.message || 'يمكنك استرجاع هذا الحساب.';
        Alert.alert('استرجاع الحساب', msg, [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'استرجاع',
            onPress: async () => {
              try {
                await restoreDeletedAccount(normalizedEmail, normalizedPassword);
                router.replace('/(tabs)');
              } catch (restoreError: any) {
                const restoreMsg = restoreError.response?.data?.error?.message;
                Alert.alert('خطأ', restoreMsg || 'فشل استرجاع الحساب.');
              }
            },
          },
        ]);
        return;
      }

      const msg = error.response?.data?.error?.message;
      Alert.alert('خطأ', msg || 'فشل تسجيل الدخول. تأكد من صحة البيانات.');
    }
  };

  const inputBg     = isDark ? '#1E2A40' : '#F8FAFC';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const labelColor  = isDark ? '#F8FAFC' : '#0A0B14';
  const inputColor  = isDark ? '#F8FAFC' : '#0A0B14';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[s.root, { backgroundColor: isDark ? '#0B0F1E' : '#F2F5FC' }]}>
      <StatusBar style="light" />

      {/* â”€â”€ Full-bleed navy hero â”€â”€ */}
      <LinearGradient colors={['#0A0F1E', '#0E1830', '#162444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        {/* Decorative blobs */}
        <View style={s.blob1} />
        <View style={s.blob2} />

        {/* Back button */}
        <TouchableOpacity
          style={[s.backBtn, { top: insets.top + 12 }]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        >
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Logo + title */}
        <View style={s.heroContent}>
          <Image source={require('../../assets/images/logo.png')} style={s.logo} contentFit="contain" />
          <Text style={s.heroTitle}>تسجيل الدخول</Text>
          <Text style={s.heroSub}>مرحباً بك مجدداً في KOM</Text>
        </View>
      </LinearGradient>

      {/* â”€â”€ Form card â”€â”€ */}
      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.card, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
          {/* Email */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor }]}>البريد الإلكتروني</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }, emailFocused && s.inputWrapFocused]}>
              <Ionicons name="mail" size={18} color={emailFocused ? '#D4AF37' : '#94A3B8'} style={s.icon} />
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder="name@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                textAlign="right"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor }]}>كلمة المرور</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }, passFocused && s.inputWrapFocused]}>
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.icon}>
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={18} color={passFocused ? '#D4AF37' : '#94A3B8'} />
              </TouchableOpacity>
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                textAlign="right"
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <Ionicons name="lock-closed" size={18} color={passFocused ? '#D4AF37' : '#94A3B8'} style={{ marginRight: 4 }} />
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={s.forgotRow}>
            <Text style={s.forgotText}>نسيت كلمة المرور؟</Text>
          </TouchableOpacity>

          {/* Login CTA */}
          <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient colors={['#17285f', '#D4AF37', '#A8860E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.loginGrad}>
              {isLoading ? (
                <ActivityIndicator color="#0A0B14" />
              ) : (
                <Text style={s.loginText}>دخول</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Register link */}
          <View style={s.footer}>
            <Text style={s.footerNote}>ليس لديك حساب؟ </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={s.registerLink}>إنشاء حساب جديد</Text>
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
    position: 'absolute', right: 20, zIndex: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroContent: { alignItems: 'center', paddingTop: 70 },
  logo: { width: 110, height: 42, marginBottom: 20 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, textAlign: 'center' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

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
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  inputWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  inputWrapFocused: { borderColor: '#D4AF37', backgroundColor: '#101b50' },
  icon: { marginLeft: 8 },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    textAlign: 'right',
  },

  // forgot
  forgotRow: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 20 },
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
  footer: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 4 },
  footerNote: { color: '#64748B', fontSize: 14 },
  registerLink: { color: '#D4AF37', fontSize: 14, fontWeight: '800' },
});

