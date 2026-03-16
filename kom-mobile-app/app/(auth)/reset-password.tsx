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
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

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
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (!checks.upper || !checks.lower || !checks.digit || !checks.special) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }
    if (!params.token) {
      Alert.alert('خطأ', 'رمز التحقق غير موجود');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token: params.token, newPassword });
      Alert.alert('تم بنجاح', 'تم إعادة تعيين كلمة المرور بنجاح', [
        { text: 'تسجيل الدخول', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
    } finally {
      setIsLoading(false);
    }
  };

  const CheckRow = ({ ok, label }: { ok: boolean; label: string }) => (
    <View style={s.reqRow}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={ok ? '#10B981' : '#9CA3AF'}
      />
      <Text style={[s.reqText, { color: mutedColor }]}>{label}</Text>
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
          style={[s.backBtn, { top: insets.top + 12 }]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
        >
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={s.heroContent}>
          <Image source={require('../../assets/images/logo.png')} style={s.logo} contentFit="contain" />
          <Text style={s.heroTitle}>إعادة تعيين كلمة المرور</Text>
          <Text style={s.heroSub}>أدخل كلمة المرور الجديدة لحسابك</Text>
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
            <Text style={[s.label, { color: labelColor }]}>كلمة المرور الجديدة</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }, newPassFocused && s.inputWrapFocused]}>
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.icon}>
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={18} color={newPassFocused ? '#D4AF37' : '#94A3B8'} />
              </TouchableOpacity>
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textAlign="right"
                onFocus={() => setNewPassFocused(true)}
                onBlur={() => setNewPassFocused(false)}
              />
              <Ionicons name="lock-closed" size={18} color={newPassFocused ? '#D4AF37' : '#94A3B8'} style={{ marginRight: 4 }} />
            </View>
          </View>

          {/* Confirm password */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor }]}>تأكيد كلمة المرور</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }, confirmFocused && s.inputWrapFocused]}>
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={s.icon}>
                <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={18} color={confirmFocused ? '#D4AF37' : '#94A3B8'} />
              </TouchableOpacity>
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                textAlign="right"
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
              />
              <Ionicons name="lock-closed" size={18} color={confirmFocused ? '#D4AF37' : '#94A3B8'} style={{ marginRight: 4 }} />
            </View>
          </View>

          {/* Requirements */}
          <View style={[s.reqBox, { backgroundColor: reqBg }]}>
            <Text style={[s.reqTitle, { color: labelColor }]}>متطلبات كلمة المرور:</Text>
            <CheckRow ok={checks.length}  label="8 أحرف على الأقل" />
            <CheckRow ok={checks.upper}   label="حرف كبير واحد على الأقل" />
            <CheckRow ok={checks.lower}   label="حرف صغير واحد على الأقل" />
            <CheckRow ok={checks.digit}   label="رقم واحد على الأقل" />
            <CheckRow ok={checks.special} label="رمز خاص واحد على الأقل (@$!%*?&)" />
          </View>

          {/* Submit */}
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient colors={['#E8C84A', '#D4AF37', '#A8860E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
              {isLoading ? (
                <ActivityIndicator color="#0A0B14" />
              ) : (
                <Text style={s.submitText}>إعادة تعيين كلمة المرور</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to login */}
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={s.backToLogin}>
            <Text style={s.backToLoginText}>العودة لتسجيل الدخول</Text>
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
    position: 'absolute', right: 20, zIndex: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroContent: { alignItems: 'center', paddingTop: 70 },
  logo: { width: 110, height: 42, marginBottom: 20 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, textAlign: 'center' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

  scrollContent: { flexGrow: 1, paddingHorizontal: 16, marginTop: -24 },
  card: {
    borderRadius: 28, padding: 24, paddingTop: 28,
    ...Platform.select({
      default: { shadowColor: '#1A2050', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 10 },
    }),
  },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  inputWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 2,
  },
  inputWrapFocused: { borderColor: '#D4AF37', backgroundColor: '#FFFDF4' },
  icon: { marginLeft: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, textAlign: 'right' },

  reqBox: { borderRadius: 14, padding: 16, marginBottom: 24 },
  reqTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12, textAlign: 'right' },
  reqRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  reqText: { fontSize: 13, textAlign: 'right', flex: 1 },

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
