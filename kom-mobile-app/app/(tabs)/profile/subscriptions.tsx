import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../services/api';

interface SubscriptionPackage {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  price3Months?: number | null;
  price6Months?: number | null;
  price12Months?: number | null;
  discountNote?: string | null;
  maxListings: number;
  durationDays: number;
}

interface Subscription {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  listingsUsed: number;
  paidAmount: number;
  package: SubscriptionPackage;
}

const RTL_TEXT = {
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
};

// ✅ Unicode RTL mark (RLM) — يثبت الاتجاه مع الأرقام والرموز (: / .)
const RLM = '\u200F';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<'1' | '3' | '6' | '12'>('1');

  const bg = isDark ? '#0B0F1E' : '#F2F5FC';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const textColor = isDark ? '#F8FAFC' : '#0A0B14';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';

  const fetchData = async () => {
    try {
      const [subRes, pkgsRes] = await Promise.all([
        api.get('/packages/my-subscription').catch(() => ({ data: null })),
        api.get('/packages').catch(() => ({ data: [] })),
      ]);
      // unwrap both responses from global interceptor
      const subData =
        subRes.data && (subRes.data as any).data !== undefined ? (subRes.data as any).data : subRes.data;
      setSubscription(subData);

      const rawPkgs = pkgsRes.data;
      const arr = Array.isArray(rawPkgs)
        ? rawPkgs
        : rawPkgs && Array.isArray((rawPkgs as any).data)
        ? (rawPkgs as any).data
        : [];
      setPackages(arr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hide bottom tabs on this screen only
  useEffect(() => {
    const parent = navigation.getParent?.();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
    };
  }, []);

  const handleSubscribe = async (packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId);

    // Calculate amount based on selected duration
    let amount: number;
    let durationLabel: string;
    if (selectedDuration === '3' && pkg?.price3Months) {
      amount = Number(pkg.price3Months);
      durationLabel = '3 أشهر';
    } else if (selectedDuration === '6' && pkg?.price6Months) {
      amount = Number(pkg.price6Months);
      durationLabel = '6 أشهر';
    } else if (selectedDuration === '12' && pkg?.price12Months) {
      amount = Number(pkg.price12Months);
      durationLabel = 'سنة كاملة';
    } else {
      amount = Number(pkg?.priceMonthly ?? 0);
      durationLabel = 'شهر واحد';
    }

    const amountStr = amount.toFixed(3);

    Alert.alert(
      'الدفع عبر Benefit',
      `${RLM}الباقة: ${pkg?.name}\n${RLM}المدة: ${durationLabel}\n${RLM}المبلغ: ${RLM}${amountStr}${RLM} د.ب${RLM}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'متابعة',
          onPress: async () => {
            setSubscribing(true);
            try {
              const res = await api.post('/payments/subscription/initiate', {
                packageId,
                durationChoice: selectedDuration,
              });
              // unwrap global backend wrapper { success, data, meta }
              const payload =
                res.data && (res.data as any).data !== undefined ? (res.data as any).data : res.data;
              const { transaction } = payload || {};
              if (!transaction) throw new Error('No transaction returned from server');
              router.push({
                pathname: '/(tabs)/profile/payment-proof' as any,
                params: {
                  transactionId: transaction.id,
                  amount: String(transaction.amount),
                  currency: transaction.currency ?? 'BHD',
                  paymentType: 'SUBSCRIPTION',
                },
              });
            } catch (e: any) {
              console.error('Subscription initiate error', e);
              const serverMsg =
                e?.response?.data?.error?.message ||
                e?.response?.data?.message ||
                (Array.isArray(e?.response?.data?.error?.details) ? e.response.data.error.details[0] : null);
              let msg = serverMsg || e?.message || 'فشل إنشاء عملية الدفع';
              if (e?.response?.status === 403) {
                msg = serverMsg || 'غير مصرح: حسابك يحتاج أن يكون معرضًا (Showroom) لإجراء هذه العملية.';
              }
              Alert.alert('خطأ', msg);
            } finally {
              setSubscribing(false);
            }
          },
        },
      ],
    );
  };

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isActive = subscription?.status === 'ACTIVE' && daysLeft > 0;

  const endDateText = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString('ar-BH')
    : '';

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: bg }]} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator color="#D4AF37" size="large" />
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
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, RTL_TEXT, { color: '#D4AF37' }]}>اشتراكاتي</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={20} color='#D4AF37' />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={{ backgroundColor: bg }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current subscription card */}
        {subscription && subscription.package && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: textColor }, RTL_TEXT]}>الاشتراك الحالي</Text>
              <View style={[styles.statusBadge, { backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2' }]}>
                <Text style={[styles.statusText, { color: isActive ? '#16A34A' : '#DC2626' }, RTL_TEXT]}>
                  {isActive ? 'نشط' : 'منتهي'}
                </Text>
              </View>
            </View>

            <Text style={[styles.pkgName, { color: '#D4AF37' }, RTL_TEXT]}>{subscription.package.name}</Text>

            <View style={styles.statsRow}>
              <StatBox
                label="الإعلانات المستخدمة"
                // ✅ ثبّت الاتجاه لأن فيه " / " وأرقام
                value={`${RLM}${subscription.listingsUsed} / ${subscription.package.maxListings ?? 0}${RLM}`}
                color="#3B82F6"
              />
              <StatBox
                label="الأيام المتبقية"
                // ✅ ثبّت الاتجاه لأن فيه رقم + كلمة
                value={`${RLM}${daysLeft}${RLM} يوم`}
                color={daysLeft <= 3 ? '#EF4444' : '#16A34A'}
              />
            </View>

            {/* Progress bar */}
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, (subscription.listingsUsed / (subscription.package.maxListings || 1)) * 100)}%` },
                ]}
              />
            </View>

            <Text style={[styles.dateText, { color: mutedColor }, RTL_TEXT]}>
              {/* ✅ ":" + تاريخ -> لازم RLM */}
              {RLM}ينتهي في:{RLM} {endDateText}
            </Text>
          </View>
        )}

        {/* Subscription exists but package was deleted */}
        {subscription && !subscription.package && (
          <View style={[styles.card, styles.emptyCard, { backgroundColor: cardBg }]}>
            <Ionicons name="warning-outline" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: textColor }, RTL_TEXT]}>الباقة غير متاحة</Text>
            <Text style={[styles.emptySub, { color: mutedColor }, RTL_TEXT]}>اختر باقة جديدة أدناه</Text>
          </View>
        )}

        {!subscription && (
          <View style={[styles.card, styles.emptyCard, { backgroundColor: cardBg }]}>
            <Ionicons name="ribbon-outline" size={48} color="#D4AF37" style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: textColor }, RTL_TEXT]}>لا يوجد اشتراك نشط</Text>
            <Text style={[styles.emptySub, { color: mutedColor }, RTL_TEXT]}>اختر إحدى الباقات أدناه للبدء</Text>
          </View>
        )}

        {/* Packages */}
        <Text style={[styles.sectionTitle, { color: textColor }, RTL_TEXT]}>
          {isActive ? 'تجديد أو تغيير الباقة' : 'اختر باقة'}
        </Text>

        {packages.map((pkg) => {
          const isCurrent = subscription?.package?.id === pkg.id && isActive;
          const isSelected = selectedPkg === pkg.id;

          // Compute price options that exist for this package
          const durationOptions: { key: '1' | '3' | '6' | '12'; label: string; price: number; saving?: string }[] = [
            { key: '1', label: 'شهر', price: Number(pkg.priceMonthly) },
          ];
          if (pkg.price3Months) durationOptions.push({ key: '3', label: '3 أشهر', price: Number(pkg.price3Months) });
          if (pkg.price6Months) durationOptions.push({ key: '6', label: '6 أشهر', price: Number(pkg.price6Months) });
          if (pkg.price12Months) durationOptions.push({ key: '12', label: 'سنة', price: Number(pkg.price12Months) });

          // Active price to display (when this card is selected use selectedDuration)
          const activeOption = durationOptions.find((o) => o.key === selectedDuration) ?? durationOptions[0];
          const pkgAmount = activeOption.price.toFixed(3);

          return (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.pkgCard,
                {
                  backgroundColor: cardBg,
                  borderColor: isCurrent
                    ? '#D4AF37'
                    : isSelected
                    ? '#3B82F6'
                    : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#E2E8F0',
                },
                (isCurrent || isSelected) && { borderWidth: 2 },
              ]}
              onPress={() => setSelectedPkg(pkg.id)}
              activeOpacity={0.8}
            >
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={[styles.currentBadgeText, RTL_TEXT]}>الباقة الحالية</Text>
                </View>
              )}

              <View style={styles.pkgRow}>
                <Text style={[styles.pkgCardName, { color: textColor }, RTL_TEXT]}>{pkg.name}</Text>

                <View style={styles.priceCol}>
                  <Text style={[styles.pkgPrice, RTL_TEXT]}>
                    {RLM}{pkgAmount}{RLM} د.ب{RLM}
                  </Text>
                  <Text style={[styles.pkgPriceSub, { color: mutedColor }, RTL_TEXT]}>
                    {RLM} / {activeOption.label} {RLM}
                  </Text>
                </View>
              </View>

              {pkg.discountNote && (
                <View style={styles.discountBadge}>
                  <Ionicons name="pricetag" size={12} color="#16A34A" />
                  <Text style={[styles.discountText, RTL_TEXT]}>{pkg.discountNote}</Text>
                </View>
              )}

              {pkg.description && <Text style={[styles.pkgDesc, { color: mutedColor }, RTL_TEXT]}>{pkg.description}</Text>}

              <View style={styles.pkgFeature}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={[styles.pkgFeatureText, { color: mutedColor }, RTL_TEXT]}>
                  حتى {RLM}{pkg.maxListings}{RLM} إعلانات نشطة
                </Text>
              </View>

              <View style={styles.pkgFeature}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={[styles.pkgFeatureText, { color: mutedColor }, RTL_TEXT]}>
                  مدة {RLM}{pkg.durationDays}{RLM} يوم
                </Text>
              </View>

              {/* Duration selector — shown only for selected package */}
              {isSelected && durationOptions.length > 1 && (
                <View style={styles.durationRow}>
                  {durationOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.durationBtn,
                        {
                          backgroundColor:
                            selectedDuration === opt.key
                              ? '#D4AF37'
                              : isDark
                              ? 'rgba(255,255,255,0.08)'
                              : '#F1F5F9',
                          borderColor: selectedDuration === opt.key ? '#D4AF37' : isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                        },
                      ]}
                      onPress={() => setSelectedDuration(opt.key)}
                    >
                      <Text
                        style={[
                          styles.durationBtnText,
                          { color: selectedDuration === opt.key ? '#0A0B14' : textColor },
                          RTL_TEXT,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          styles.durationBtnPrice,
                          { color: selectedDuration === opt.key ? '#0A0B14' : mutedColor },
                          RTL_TEXT,
                        ]}
                      >
                        {opt.price.toFixed(3)} د.ب
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Subscribe button */}
        {selectedPkg && (
          <TouchableOpacity style={styles.subscribeBtn} onPress={() => handleSubscribe(selectedPkg)} disabled={subscribing} activeOpacity={0.85}>
            <LinearGradient
              colors={['#E8C84A', '#D4AF37', '#A8860E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeBtnGrad}
            >
              {subscribing ? (
                <ActivityIndicator color="#0A0B14" />
              ) : (
                <Text style={[styles.subscribeBtnText, RTL_TEXT]}>
                  {isActive ? 'تجديد / تغيير الباقة عبر Benefit' : 'الدفع عبر Benefit'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isActive && !selectedPkg && (
          <Text style={[styles.renewNote, { color: mutedColor }, RTL_TEXT]}>
            يمكنك تجديد أو تغيير باقتك بعد انتهاء الاشتراك الحالي.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={statStyles.box}>
      <Text style={[statStyles.value, { color }, RTL_TEXT]}>{value}</Text>
      <Text style={[statStyles.label, RTL_TEXT]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  value: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  label: { fontSize: 11, color: '#94A3B8' },
});

const styles = StyleSheet.create({
  container: { flex: 1, writingDirection: 'rtl' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 12,
    writingDirection: 'rtl',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  scrollContent: { padding: 16, paddingBottom: 48 },

  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
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
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  pkgName: { fontSize: 20, fontWeight: '900', marginBottom: 16 },
  statsRow: { flexDirection: 'row-reverse', marginBottom: 12 },
  progressBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#D4AF37', borderRadius: 4 },
  dateText: { fontSize: 12 },

  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14 },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, marginTop: 4 },

  pkgCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    position: 'relative',
    alignSelf: 'center',
    width: '94%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    ...Platform.select({
      default: {
        shadowColor: '#0A0F1E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },
  currentBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#D4AF37', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  currentBadgeText: { fontSize: 12, fontWeight: '800', color: '#0A0B14' },

  pkgRow: { flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: 8, gap: 6 },

  priceCol: { alignItems: 'center', marginTop: 6 },

  pkgCardName: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  pkgPrice: { fontSize: 22, fontWeight: '900', color: '#D4AF37', textAlign: 'center' },
  pkgPriceSub: { fontSize: 12 },
  pkgDesc: { fontSize: 13, marginBottom: 8 },

  pkgFeature: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 4, justifyContent: 'center' },
  pkgFeatureText: { fontSize: 13 },

  subscribeBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
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
  subscribeBtnGrad: { paddingVertical: 17, alignItems: 'center' },
  subscribeBtnText: { color: '#0A0B14', fontSize: 16, fontWeight: '900' },

  renewNote: { textAlign: 'center', fontSize: 13, marginBottom: 16 },

  discountBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'center',
  },
  discountText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },

  durationRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  durationBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  durationBtnText: { fontSize: 13, fontWeight: '800' },
  durationBtnPrice: { fontSize: 11, marginTop: 2 },
});