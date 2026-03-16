import React, { useState } from 'react';
import AdsBanner from '@/components/ads/AdsBanner';
import LuckCodeModal from '@/components/luck/LuckCodeModal';
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

const MERCHANT_TYPES = [
  { value: 'CAR_SHOWROOM', label: 'معرض سيارات' },
  { value: 'SPARE_PARTS',  label: 'قطع الغيار'  },
  { value: 'PLATES',       label: 'لوحات'        },
  { value: 'MOTORCYCLES',  label: 'درجات'        },
] as const;

export default function RegisterScreen() {
  const router = useRouter();
  const { register, restoreDeletedAccount, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [userType, setUserType] = useState<'INDIVIDUAL' | 'SHOWROOM'>('INDIVIDUAL');
  const [merchantType, setMerchantType] = useState('CAR_SHOWROOM');
  const [fullName, setFullName] = useState('');
  const [showroomName, setShowroomName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [luckCode, setLuckCode] = useState<string | null>(null);
  const [showLuckModal, setShowLuckModal] = useState(false);

  const getPasswordIssues = (value: string): string[] => {
    const issues: string[] = [];
    if (value.length < 8) issues.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    if (!/[a-z]/.test(value)) issues.push('يجب أن تحتوي على حرف صغير (a-z)');
    if (!/[A-Z]/.test(value)) issues.push('يجب أن تحتوي على حرف كبير (A-Z)');
    if (!/\d/.test(value)) issues.push('يجب أن تحتوي على رقم (0-9)');
    if (!/[@$!%*?&]/.test(value)) issues.push('يجب أن تحتوي على رمز خاص (@ $ ! % * ? &)');
    return issues;
  };

  const handleRegister = async () => {
    const name = userType === 'INDIVIDUAL' ? fullName : showroomName;

    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
      return;
    }

    if (userType === 'SHOWROOM' && !crNumber.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم السجل التجاري');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('تنبيه', 'كلمة المرور غير متطابقة');
      return;
    }

    const passwordIssues = getPasswordIssues(password);
    if (passwordIssues.length) {
      Alert.alert('كلمة مرور غير قوية', passwordIssues.join('\n'));
      return;
    }

    try {
      const result = await register(userType, name, email, password, crNumber, phone, merchantType);
      if (result && result.status === 'PENDING') {
        const code = result.luckCode ?? null;
        if (code) {
          setLuckCode(code);
          setShowLuckModal(true);
        } else {
          Alert.alert('تم استلام الطلب', 'تم إنشاء الحساب وهو قيد المراجعة.', [
            { text: 'فهمت', onPress: () => router.replace('/(tabs)') },
          ]);
        }
      } else {
        Alert.alert('تم التسجيل بنجاح', 'تم إنشاء حسابك بنجاح', [
          { text: 'موافق', onPress: () => router.replace('/(tabs)') },
        ]);
      }
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      if (errorData?.code === 'ACCOUNT_RECOVERY_REQUIRED') {
        Alert.alert('استرجاع الحساب', errorData.message || 'يوجد حساب محذوف مؤقتاً بهذا البريد.', [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'استرجاع الحساب',
            onPress: async () => {
              try {
                await restoreDeletedAccount(email.trim(), password.trim());
                Alert.alert('تم الاسترجاع', 'تم استرجاع حسابك بنجاح.', [
                  { text: 'موافق', onPress: () => router.replace('/(tabs)') },
                ]);
              } catch (restoreError: any) {
                const restoreMsg = restoreError.response?.data?.error?.message;
                Alert.alert('خطأ', restoreMsg || 'فشل استرجاع الحساب.');
              }
            },
          },
        ]);
        return;
      }

      if (errorData?.details && Array.isArray(errorData.details)) {
        const asStrings = errorData.details.filter((d: any) => typeof d === 'string');
        if (asStrings.length) {
          Alert.alert('خطأ في التحقق من البيانات', asStrings.join('\n'));
          return;
        }
        const errorMessages = errorData.details
          .map((detail: any) => {
            const field = detail.field || detail.property || 'حقل';
            const message = detail.message || detail.constraints || 'قيمة غير صحيحة';
            return `${field}: ${message}`;
          })
          .join('\n');
        Alert.alert('خطأ في التحقق من البيانات', errorMessages || 'بيانات غير صحيحة');
      } else if (errorData?.message) {
        Alert.alert('خطأ', errorData.message);
      } else if (error.response?.data?.message) {
        Alert.alert('خطأ', error.response.data.message);
      } else {
        Alert.alert('خطأ', 'فشل إنشاء الحساب. قد يكون البريد الإلكتروني مستخدماً مسبقاً.');
      }
    }
  };

  const inputBg     = isDark ? '#1E2A40' : '#F8FAFC';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const labelColor  = isDark ? '#F8FAFC' : '#0A0B14';
  const inputColor  = isDark ? '#F8FAFC' : '#0A0B14';
  const cardBg      = isDark ? '#111827' : '#FFFFFF';

  return (
    <>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[s.root, { backgroundColor: isDark ? '#0B0F1E' : '#F2F5FC' }]}
    >
      <StatusBar style="light" />

      {/* Navy hero */}
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
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        >
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={s.heroContent}>
          <Image source={require('../../assets/images/logo.png')} style={s.logo} contentFit="contain" />
          <Text style={s.heroTitle}>حساب جديد</Text>
          <Text style={s.heroSub}>انضم إلينا وابدأ البيع والشراء اليوم</Text>
        </View>
      </LinearGradient>

      {/* Form card */}
      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.card, { backgroundColor: cardBg }]}>

          {/* User type selector */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor }]}>نوع الحساب</Text>
            <View style={s.segmentRow}>
              {(['INDIVIDUAL', 'SHOWROOM'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[s.segmentBtn, userType === type && s.segmentBtnActive]}
                  onPress={() => setUserType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.segmentText, userType === type && s.segmentTextActive]}>
                    {type === 'INDIVIDUAL' ? 'فرد' : 'تاجر'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Merchant type picker */}
          {userType === 'SHOWROOM' && (
            <View style={s.inputGroup}>
              <Text style={[s.label, { color: labelColor }]}>نوع التاجر</Text>
              <View style={s.merchantGrid}>
                {MERCHANT_TYPES.map((mt) => (
                  <TouchableOpacity
                    key={mt.value}
                    style={[s.merchantBtn, merchantType === mt.value && s.merchantBtnActive]}
                    onPress={() => setMerchantType(mt.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.merchantText, merchantType === mt.value && s.merchantTextActive]}>
                      {mt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Name */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor }]}>
              {userType === 'INDIVIDUAL' ? 'الاسم الكامل' : 'اسم المعرض / المتجر'}
            </Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Ionicons name="person" size={18} color="#94A3B8" style={s.icon} />
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder={userType === 'INDIVIDUAL' ? 'محمد علي' : 'معرض الخليج'}
                placeholderTextColor="#94A3B8"
                value={userType === 'INDIVIDUAL' ? fullName : showroomName}
                onChangeText={userType === 'INDIVIDUAL' ? setFullName : setShowroomName}
                textAlign="right"
              />
            </View>
          </View>

          {/* CR Number */}
          {userType === 'SHOWROOM' && (
            <View style={s.inputGroup}>
              <Text style={[s.label, { color: labelColor }]}>رقم السجل التجاري</Text>
              <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <Ionicons name="document-text" size={18} color="#94A3B8" style={s.icon} />
                <TextInput
                  style={[s.input, { color: inputColor }]}
                  placeholder="12-3456"
                  placeholderTextColor="#94A3B8"
                  value={crNumber}
                  onChangeText={setCrNumber}
                  textAlign="right"
                />
              </View>
            </View>
          )}

          {/* Email */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor }]}>البريد الإلكتروني</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Ionicons name="mail" size={18} color="#94A3B8" style={s.icon} />
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder="name@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textAlign="right"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor }]}>رقم الهاتف (اختياري)</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Ionicons name="call" size={18} color="#94A3B8" style={s.icon} />
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder="+97339001001"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor }]}>كلمة المرور</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={s.icon}>
                <Ionicons name={showPass ? 'eye' : 'eye-off'} size={18} color="#94A3B8" />
              </TouchableOpacity>
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                selectionColor={inputColor}
                textAlign={showPass ? 'right' : 'left'}
              />
              <Ionicons name="lock-closed" size={18} color="#94A3B8" style={{ marginRight: 4 }} />
            </View>
            <Text style={s.hint}>
              8 أحرف+ • حرف كبير • حرف صغير • رقم • رمز (@$!%*?&)
            </Text>
          </View>

          {/* Confirm password */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor }]}>تأكيد كلمة المرور</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <TouchableOpacity onPress={() => setShowConfirmPass((v) => !v)} style={s.icon}>
                <Ionicons name={showConfirmPass ? 'eye' : 'eye-off'} size={18} color="#94A3B8" />
              </TouchableOpacity>
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPass}
                autoCapitalize="none"
                selectionColor={inputColor}
                textAlign={showConfirmPass ? 'right' : 'left'}
              />
              <Ionicons name="lock-closed" size={18} color="#94A3B8" style={{ marginRight: 4 }} />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity style={s.submitBtn} onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient
              colors={['#E8C84A', '#D4AF37', '#A8860E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.submitGrad}
            >
              {isLoading ? (
                <ActivityIndicator color="#0A0B14" />
              ) : (
                <Text style={s.submitText}>إنشاء حساب</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login link */}
          <View style={s.footer}>
            <Text style={s.footerNote}>لديك حساب بالفعل؟ </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={s.loginLink}>تسجيل الدخول</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        <AdsBanner />
      </ScrollView>
    </KeyboardAvoidingView>

    {luckCode && (
      <LuckCodeModal
        visible={showLuckModal}
        code={luckCode!}
        onClose={() => {
          setShowLuckModal(false);
          router.replace('/(tabs)');
        }}
      />
    )}
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // hero
  hero: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  blob1: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(212,175,55,0.07)', top: -80, right: -60,
  },
  blob2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(212,175,55,0.05)', bottom: -20, left: -50,
  },
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
      default: {
        shadowColor: '#1A2050',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
      },
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
  icon: { marginLeft: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, textAlign: 'right' },
  hint: { marginTop: 6, fontSize: 11, color: '#94A3B8', textAlign: 'right', lineHeight: 16 },

  // user type segment
  segmentRow: { flexDirection: 'row', gap: 12 },
  segmentBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  segmentTextActive: { color: '#FFFFFF' },

  // merchant type grid (2×2)
  merchantGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  merchantBtn: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  merchantBtnActive: { backgroundColor: '#162444', borderColor: '#D4AF37' },
  merchantText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  merchantTextActive: { color: '#D4AF37' },

  // submit
  submitBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 24,
    ...Platform.select({
      default: {
        shadowColor: '#C9A227',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
      },
    }),
  },
  submitGrad: { paddingVertical: 17, alignItems: 'center' },
  submitText: { color: '#0A0B14', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  // footer
  footer: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 4 },
  footerNote: { color: '#64748B', fontSize: 14 },
  loginLink: { color: '#D4AF37', fontSize: 14, fontWeight: '800' },
});
