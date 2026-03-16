import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Clipboard,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../context/ThemeContext';
import api from '../../../services/api';

const BENEFIT_ACCOUNT_NUMBER = '36883800';

export default function PaymentProofScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isDark } = useTheme();

  const { transactionId, amount, currency, paymentType } = useLocalSearchParams<{
    transactionId: string;
    amount: string;
    currency: string;
    paymentType: string;
  }>();

  const [proofUri, setProofUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const bg = isDark ? '#0B0F1E' : '#F2F5FC';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const textColor = isDark ? '#F8FAFC' : '#0A0B14';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  // Hide bottom tabs on this screen only
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  const amountText = useMemo(() => {
    const n = Number(amount ?? 0);
    return `${n.toFixed(3)} ${currency ?? 'BHD'}`;
  }, [amount, currency]);

  const paymentTypeText = useMemo(() => {
    if (paymentType === 'SUBSCRIPTION') return 'رسوم الاشتراك';
    if (paymentType === 'FEATURED_LISTING') return 'رسوم تمييز الإعلان';
    return 'رسوم نشر الإعلان';
  }, [paymentType]);

  const handleCopy = (value: string, label: string) => {
    if (!value) return;
    Clipboard.setString(value);
    Alert.alert('تم النسخ', `تم نسخ ${label}`);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يجب منح إذن الوصول إلى الصور لرفع إثبات الدفع');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProofUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!proofUri) {
      Alert.alert('مطلوب', 'يرجى اختيار صورة إثبات التحويل أولاً');
      return;
    }
    if (!transactionId) {
      Alert.alert('خطأ', 'معرّف المعاملة غير موجود');
      return;
    }

    setUploading(true);
    try {
      // Step 1: upload image (Web + Native)
      const filename = proofUri.split('/').pop() ?? `proof-${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();

      if (Platform.OS === 'web') {
        // proofUri on web is usually a blob: url
        const resp = await fetch(proofUri);
        const blob = await resp.blob();
        const file = new File([blob], filename, { type: (blob as any).type || mimeType });
        formData.append('file', file);
      } else {
        formData.append('file', { uri: proofUri, name: filename, type: mimeType } as any);
      }

      const uploadRes = await api.post('/payments/upload-proof-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadPayload = uploadRes.data?.data ?? uploadRes.data ?? {};
      const proofImageUrl: string = uploadPayload.url;

      if (!proofImageUrl) {
        throw new Error('لم يتم استلام رابط الصورة من السيرفر');
      }

      // Step 2: submit proof URL
      await api.post(`/payments/${transactionId}/submit-proof`, { proofImageUrl });

      setSubmitted(true);
    } catch (e: any) {
      const server = e?.response?.data ?? {};
      const msg =
        server?.error?.message ||
        server?.message ||
        e?.message ||
        'فشل رفع الإثبات، يرجى المحاولة مرة أخرى';
      Alert.alert('خطأ', msg);
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#0E1830' }]} edges={['left', 'right', 'bottom']}>
        <StatusBar style='light' />
        <View style={[styles.successContainer, { backgroundColor: bg }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
          </View>

          <Text style={[styles.successTitle, { color: textColor }, styles.rtlTextCenter]}>تم الإرسال بنجاح!</Text>
          <Text style={[styles.successSub, { color: mutedColor }, styles.rtlTextCenter]}>
            تم إرسال إثبات التحويل وسيتم مراجعته من قِبل الإدارة خلال 24 ساعة.
          </Text>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.replace('/(tabs)/profile/payments' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#E8C84A', '#D4AF37', '#A8860E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.doneBtnGrad}
            >
              <Text style={[styles.doneBtnText, styles.rtlTextCenter]}>العودة لمدفوعاتي</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0E1830' }]} edges={['left', 'right', 'bottom']}>
      <StatusBar style='light' />

      {/* Header */}
      <LinearGradient
        colors={['#0E1830', '#162444']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={20} color='#D4AF37' />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, styles.rtlTextCenter, { color: '#D4AF37' }]}>إثبات الدفع</Text>

          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={{ backgroundColor: bg }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Amount card */}
        <View style={[styles.amountCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.amountLabel, { color: mutedColor }, styles.rtlText]}>مبلغ الدفع</Text>
          <Text style={[styles.amountValue, { color: '#D4AF37' }, styles.rtlTextCenter]}>{amountText}</Text>
          <Text style={[styles.amountType, { color: mutedColor }, styles.rtlText]}>{paymentTypeText}</Text>
        </View>

        {/* Steps */}
        <View style={[styles.stepsCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.stepsTitle, { color: textColor }, styles.rtlText]}>خطوات الدفع عبر Benefit</Text>

          {[
            'انسخ رقم الحساب أدناه',
            `حوّل المبلغ ${Number(amount ?? 0).toFixed(3)} د.ب عبر تطبيق Benefit`,
            'التقط لقطة شاشة لإثبات التحويل',
            'ارفع الصورة وانقر على "إرسال"',
          ].map((step, i) => (
            <View key={i} style={styles.stepRowRtl}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: mutedColor }, styles.rtlText]}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Account number card (ONLY) */}
        <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.infoLabel, { color: mutedColor }, styles.rtlText]}>رقم الحساب</Text>

          <Text style={[styles.infoValue, { color: textColor }, styles.ltrNumber]} selectable>
            {BENEFIT_ACCOUNT_NUMBER}
          </Text>

          <TouchableOpacity
            style={styles.copyBtnRtl}
            onPress={() => handleCopy(BENEFIT_ACCOUNT_NUMBER, 'رقم الحساب')}
            activeOpacity={0.75}
          >
            <Ionicons name="copy-outline" size={16} color="#D4AF37" />
            <Text style={styles.copyBtnText}>نسخ رقم الحساب</Text>
          </TouchableOpacity>
        </View>

        {/* Image picker */}
        <TouchableOpacity
          style={[
            styles.pickerArea,
            { backgroundColor: cardBg, borderColor: proofUri ? '#16A34A' : borderColor },
          ]}
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          {proofUri ? (
            <>
              <Image source={{ uri: proofUri }} style={styles.previewImage} contentFit="cover" />
              <View style={styles.changeOverlay}>
                <Ionicons name="camera" size={22} color="#FFF" />
                <Text style={[styles.changeText, styles.rtlTextCenter]}>تغيير الصورة</Text>
              </View>
            </>
          ) : (
            <View style={styles.pickerPlaceholder}>
              <Ionicons name="image-outline" size={48} color="#D4AF37" />
              <Text style={[styles.pickerTitle, { color: textColor }, styles.rtlTextCenter]}>ارفع إثبات التحويل</Text>
              <Text style={[styles.pickerSub, { color: mutedColor }, styles.rtlTextCenter]}>
                اضغط لاختيار صورة من معرض الصور
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitBtn, !proofUri && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={uploading || !proofUri}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={proofUri ? ['#E8C84A', '#D4AF37', '#A8860E'] : ['#6B7280', '#6B7280']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtnGradRtl}
          >
            {uploading ? (
              <ActivityIndicator color="#0A0B14" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color="#0A0B14" style={{ marginRight: 8 }} />
                <Text style={[styles.submitBtnText, styles.rtlTextCenter]}>إرسال إثبات الدفع</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.note, { color: mutedColor }, styles.rtlTextCenter]}>
          سيتم مراجعة إثباتك من قِبل الإدارة وتفعيل حسابك خلال 24 ساعة.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  rtlTextCenter: { writingDirection: 'rtl', textAlign: 'center' },
  ltrNumber: { writingDirection: 'ltr', textAlign: 'center', letterSpacing: 1.5 },

  header: { paddingHorizontal: 16, paddingVertical: 16, paddingTop: 12 },
  headerInner: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', flex: 1 },

  scrollContent: { padding: 16, paddingBottom: 48 },

  amountCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    ...Platform.select({
      default: {
        shadowColor: '#1A2050',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  amountLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  amountValue: { fontSize: 36, fontWeight: '900', marginBottom: 4 },
  amountType: { fontSize: 13 },

  stepsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    ...Platform.select({
      default: {
        shadowColor: '#1A2050',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  stepsTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  stepRowRtl: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 12 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(212,175,55,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  stepNumText: { fontSize: 13, fontWeight: '800', color: '#D4AF37' },
  stepText: { fontSize: 14, flex: 1, lineHeight: 20 },

  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    ...Platform.select({
      default: {
        shadowColor: '#1A2050',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  infoLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  infoValue: { fontSize: 22, fontWeight: '900', marginBottom: 12 },

  copyBtnRtl: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  copyBtnText: { color: '#D4AF37', fontSize: 14, fontWeight: '700', writingDirection: 'rtl' },

  pickerArea: {
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'center',
    ...Platform.select({
      default: {
        shadowColor: '#1A2050',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  pickerPlaceholder: { alignItems: 'center', padding: 32 },
  pickerTitle: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  pickerSub: { fontSize: 13 },
  previewImage: { width: '100%', height: 260 },
  changeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  changeText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  submitBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 12,
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
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnGradRtl: { paddingVertical: 17, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#0A0B14', fontSize: 16, fontWeight: '900' },

  note: { fontSize: 12, lineHeight: 18 },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: {
    marginBottom: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(22,163,74,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12 },
  successSub: { fontSize: 15, lineHeight: 24, marginBottom: 32 },
  doneBtn: { borderRadius: 28, overflow: 'hidden', width: '100%' },
  doneBtnGrad: { paddingVertical: 17, alignItems: 'center' },
  doneBtnText: { color: '#0A0B14', fontSize: 16, fontWeight: '900' },
});