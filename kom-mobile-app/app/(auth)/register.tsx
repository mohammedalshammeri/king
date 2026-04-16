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
import SocialAuthSection, { SocialAuthProviderPayload } from '@/components/auth/SocialAuthSection';
import { useAppTranslation, useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const MERCHANT_TYPES = [
  { value: 'CAR_SHOWROOM', labelKey: 'merchantTypes.carShowroom' },
  { value: 'SPARE_PARTS',  labelKey: 'merchantTypes.spareParts'  },
  { value: 'PLATES',       labelKey: 'merchantTypes.plates'      },
  { value: 'MOTORCYCLES',  labelKey: 'merchantTypes.motorcycles' },
] as const;

export default function RegisterScreen() {
  const router = useRouter();
  const { register, restoreDeletedAccount, socialAuth, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();

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
    if (value.length < 8) issues.push(t('auth.passwordReqLength'));
    if (!/[a-z]/.test(value)) issues.push(t('auth.passwordReqLower'));
    if (!/[A-Z]/.test(value)) issues.push(t('auth.passwordReqUpper'));
    if (!/\d/.test(value)) issues.push(t('auth.passwordReqDigit'));
    if (!/[@$!%*?&]/.test(value)) issues.push(t('auth.passwordReqSpecial'));
    return issues;
  };

  const handleRegister = async () => {
    const name = userType === 'INDIVIDUAL' ? fullName : showroomName;

    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert(t('common.warning'), t('auth.fillAllFields'));
      return;
    }

    if (userType === 'SHOWROOM' && !crNumber.trim()) {
      Alert.alert(t('common.warning'), t('auth.enterCrNumber'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.warning'), t('auth.passwordsMismatch'));
      return;
    }

    const passwordIssues = getPasswordIssues(password);
    if (passwordIssues.length) {
      Alert.alert(t('auth.weakPasswordTitle'), passwordIssues.join('\n'));
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
          Alert.alert(t('auth.registrationPendingTitle'), t('auth.registrationPendingMessage'), [
            { text: t('common.understood'), onPress: () => router.replace('/(tabs)') },
          ]);
        }
      } else {
        Alert.alert(t('auth.registerSuccessTitle'), t('auth.registerSuccessMessage'), [
          { text: t('common.ok'), onPress: () => router.replace('/(tabs)') },
        ]);
      }
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      if (errorData?.code === 'ACCOUNT_RECOVERY_REQUIRED') {
        Alert.alert(t('auth.accountRecoveryTitle'), errorData.message || t('auth.accountDeletedTemporary'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('auth.restoreAccount'),
            onPress: async () => {
              try {
                await restoreDeletedAccount(email.trim(), password.trim());
                Alert.alert(t('auth.restoreAccountSuccess'), t('auth.restoreAccountSuccessMessage'), [
                  { text: t('common.ok'), onPress: () => router.replace('/(tabs)') },
                ]);
              } catch (restoreError: any) {
                const restoreMsg = restoreError.response?.data?.error?.message;
                Alert.alert(t('common.error'), restoreMsg || t('auth.restoreAccountFailed'));
              }
            },
          },
        ]);
        return;
      }

      if (errorData?.details && Array.isArray(errorData.details)) {
        const asStrings = errorData.details.filter((d: any) => typeof d === 'string');
        if (asStrings.length) {
          Alert.alert(t('auth.validationErrorTitle'), asStrings.join('\n'));
          return;
        }
        const errorMessages = errorData.details
          .map((detail: any) => {
            const field = detail.field || detail.property || t('common.requiredField');
            const message = detail.message || detail.constraints || t('auth.validationInvalidData');
            return `${field}: ${message}`;
          })
          .join('\n');
        Alert.alert(t('auth.validationErrorTitle'), errorMessages || t('auth.validationInvalidData'));
      } else if (errorData?.message) {
        Alert.alert(t('common.error'), errorData.message);
      } else if (error.response?.data?.message) {
        Alert.alert(t('common.error'), error.response.data.message);
      } else {
        Alert.alert(t('common.error'), t('auth.registerFailed'));
      }
    }
  };

  const handleSocialRegister = async ({ provider, idToken, fullName: providerFullName }: SocialAuthProviderPayload) => {
    if (userType === 'SHOWROOM') {
      if (!showroomName.trim()) {
        Alert.alert(t('common.warning'), t('auth.fillAllFields'));
        return;
      }

      if (!crNumber.trim()) {
        Alert.alert(t('common.warning'), t('auth.enterCrNumber'));
        return;
      }
    }

    const result = await socialAuth({
      provider,
      idToken,
      userType,
      ...(userType === 'INDIVIDUAL'
        ? { fullName: fullName.trim() || providerFullName }
        : {
            showroomName: showroomName.trim(),
            crNumber: crNumber.trim(),
            merchantType,
          }),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    });

    if (result.user?.luckCode) {
      setLuckCode(result.user.luckCode);
      setShowLuckModal(true);
      return;
    }

    router.replace('/(tabs)');
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
          style={[s.backBtn, isRTL ? s.backBtnRtl : s.backBtnLtr, { top: insets.top + 12 }]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={[s.heroContent, isRTL ? s.heroContentRtl : s.heroContentLtr]}>
          <Image source={require('../../assets/images/logo.png')} style={s.logo} contentFit="contain" />
          <Text style={[s.heroTitle, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('auth.registerTitle')}</Text>
          <Text style={[s.heroSub, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('auth.registerSubtitle')}</Text>
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
            <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.userType')}</Text>
            <View style={[s.segmentRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {(['INDIVIDUAL', 'SHOWROOM'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[s.segmentBtn, userType === type && s.segmentBtnActive]}
                  onPress={() => setUserType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.segmentText, userType === type && s.segmentTextActive]}>
                    {type === 'INDIVIDUAL' ? t('auth.individual') : t('auth.merchant')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Merchant type picker */}
          {userType === 'SHOWROOM' && (
            <View style={s.inputGroup}>
              <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.merchantType')}</Text>
              <View style={[s.merchantGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {MERCHANT_TYPES.map((mt) => (
                  <TouchableOpacity
                    key={mt.value}
                    style={[s.merchantBtn, merchantType === mt.value && s.merchantBtnActive]}
                    onPress={() => setMerchantType(mt.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.merchantText, merchantType === mt.value && s.merchantTextActive]}>
                      {t(mt.labelKey as any)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Name */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor }]}>
              {userType === 'INDIVIDUAL' ? t('auth.fullName') : t('auth.showroomName')}
            </Text>
            <View style={[s.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Ionicons name="person" size={18} color="#94A3B8" style={s.icon} />
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder={userType === 'INDIVIDUAL' ? t('auth.fullNamePlaceholder') : t('auth.showroomNamePlaceholder')}
                placeholderTextColor="#94A3B8"
                value={userType === 'INDIVIDUAL' ? fullName : showroomName}
                onChangeText={userType === 'INDIVIDUAL' ? setFullName : setShowroomName}
                textAlign={isRTL ? 'right' : 'left'}
                writingDirection={isRTL ? 'rtl' : 'ltr'}
              />
            </View>
          </View>

          {/* CR Number */}
          {userType === 'SHOWROOM' && (
            <View style={s.inputGroup}>
              <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.crNumber')}</Text>
              <View style={[s.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: inputBg, borderColor: inputBorder }]}>
                <Ionicons name="document-text" size={18} color="#94A3B8" style={s.icon} />
                <TextInput
                  style={[s.input, { color: inputColor }]}
                  placeholder={t('auth.crNumberPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  value={crNumber}
                  onChangeText={setCrNumber}
                  textAlign={isRTL ? 'right' : 'left'}
                  writingDirection={isRTL ? 'rtl' : 'ltr'}
                />
              </View>
            </View>
          )}

          {/* Email */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.email')}</Text>
            <View style={[s.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Ionicons name="mail" size={18} color="#94A3B8" style={s.icon} />
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textAlign={isRTL ? 'right' : 'left'}
                writingDirection={isRTL ? 'rtl' : 'ltr'}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.phoneOptional')}</Text>
            <View style={[s.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Ionicons name="call" size={18} color="#94A3B8" style={s.icon} />
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder={t('auth.phonePlaceholder')}
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textAlign={isRTL ? 'right' : 'left'}
                writingDirection={isRTL ? 'rtl' : 'ltr'}
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.password')}</Text>
            <View style={[s.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Ionicons name="lock-closed" size={18} color="#94A3B8" style={s.icon} />
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                selectionColor={inputColor}
                textAlign={isRTL ? 'right' : 'left'}
                writingDirection={isRTL ? 'rtl' : 'ltr'}
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={{ paddingHorizontal: 8 }}>
                <Ionicons name={showPass ? 'eye' : 'eye-off'} size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Text style={[s.hint, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {t('auth.passwordHint')}
            </Text>
          </View>

          {/* Confirm password */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: labelColor, textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.confirmPassword')}</Text>
            <View style={[s.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Ionicons name="lock-closed" size={18} color="#94A3B8" style={s.icon} />
              <TextInput
                style={[s.input, { color: inputColor }]}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPass}
                autoCapitalize="none"
                selectionColor={inputColor}
                textAlign={isRTL ? 'right' : 'left'}
                writingDirection={isRTL ? 'rtl' : 'ltr'}
              />
              <TouchableOpacity onPress={() => setShowConfirmPass((v) => !v)} style={{ paddingHorizontal: 8 }}>
                <Ionicons name={showConfirmPass ? 'eye' : 'eye-off'} size={18} color="#94A3B8" />
              </TouchableOpacity>
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
                <Text style={s.submitText}>{t('auth.createAccountButton')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <SocialAuthSection mode="register" disabled={isLoading} onAuthenticate={handleSocialRegister} />

          {/* Login link */}
          <View style={[s.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={s.footerNote}>{t('auth.haveAccount')}</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={s.loginLink}>{t('auth.login')}</Text>
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
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, width: '100%' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', width: '100%' },

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
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrap: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  icon: { marginStart: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15 },
  hint: { marginTop: 6, fontSize: 11, color: '#94A3B8', lineHeight: 16 },

  // user type segment
  segmentRow: { gap: 12 },
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
  merchantGrid: { flexWrap: 'wrap', gap: 10 },
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
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  footerNote: { color: '#64748B', fontSize: 14 },
  loginLink: { color: '#D4AF37', fontSize: 14, fontWeight: '800' },
});
