import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../services/api';

// ✅ Unicode RTL mark
const RLM = '\u200F';

const RTL_TEXT = {
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
};

interface IndividualPackage {
  id: string;
  name: string;
  description?: string;
  listingCount: number;
  price: number;
  currency: string;
}

interface IndividualPurchase {
  id: string;
  creditsTotal: number;
  creditsUsed: number;
  status: 'ACTIVE' | 'EXHAUSTED';
  paidAmount: number;
  createdAt: string;
  package: IndividualPackage;
}

export default function IndividualPackagesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isDark } = useTheme();

  const [packages, setPackages] = useState<IndividualPackage[]>([]);
  const [purchases, setPurchases] = useState<IndividualPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const bg = isDark ? '#0B0F1E' : '#F2F5FC';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const textColor = isDark ? '#F8FAFC' : '#0A0B14';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';

  const totalCredits = purchases.reduce((sum, p) => sum + (p.creditsTotal - p.creditsUsed), 0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgsRes, creditsRes] = await Promise.all([
        api.get('/packages/individual').catch(() => ({ data: [] })),
        api.get('/packages/my-credits').catch(() => ({ data: [] })),
      ]);

      const rawPkgs = pkgsRes.data;
      const pkgsArr = Array.isArray(rawPkgs)
        ? rawPkgs
        : rawPkgs && Array.isArray((rawPkgs as any).data)
        ? (rawPkgs as any).data
        : [];
      setPackages(pkgsArr);

      const rawCredits = creditsRes.data;
      const creditsArr = Array.isArray(rawCredits)
        ? rawCredits
        : rawCredits && Array.isArray((rawCredits as any).data)
        ? (rawCredits as any).data
        : [];
      setPurchases(creditsArr);
    } catch (e) {
      console.error('Error fetching individual packages', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Hide bottom tabs on this screen
  useEffect(() => {
    const parent = navigation.getParent?.();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
    };
  }, []);

  const handlePurchase = async (pkg: IndividualPackage) => {
    const amountStr = Number(pkg.price).toFixed(3);

    Alert.alert(
      'شراء باقة إعلانات',
      `${RLM}الباقة: ${pkg.name}\n${RLM}الإعلانات: ${RLM}${pkg.listingCount}${RLM} إعلان\n${RLM}المبلغ: ${RLM}${amountStr}${RLM} د.ب${RLM}\n\nسيتم توجيهك لرفع إثبات التحويل البنكي`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'متابعة للدفع',
          onPress: async () => {
            setPurchasing(true);
            try {
              const res = await api.post('/payments/individual-package/initiate', {
                packageId: pkg.id,
              });
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
                  paymentType: 'INDIVIDUAL_PACKAGE',
                },
              });
            } catch (e: any) {
              console.error('Individual package purchase error', e);
              const serverMsg =
                e?.response?.data?.error?.message ||
                e?.response?.data?.message ||
                (Array.isArray(e?.response?.data?.error?.details) ? e.response.data.error.details[0] : null);
              const msg = serverMsg || e?.message || 'فشل إنشاء عملية الدفع';
              Alert.alert('خطأ', msg);
            } finally {
              setPurchasing(false);
            }
          },
        },
      ],
    );
  };

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
        <Text style={[styles.headerTitle, RTL_TEXT, { color: '#D4AF37' }]}>باقات الإعلانات</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={20} color='#D4AF37' />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={{ backgroundColor: bg }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Credit Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: cardBg }]}>
          <LinearGradient
            colors={['#D4AF37', '#A8860E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceIconBg}
          >
            <Ionicons name="megaphone" size={24} color="#0A0B14" />
          </LinearGradient>

          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, { color: mutedColor }, RTL_TEXT]}>رصيد إعلاناتك</Text>
            <Text style={[styles.balanceValue, { color: textColor }, RTL_TEXT]}>
              {RLM}{totalCredits}{RLM} إعلان{totalCredits === 1 ? '' : totalCredits === 0 ? '' : ''}
            </Text>
          </View>

          {totalCredits === 0 && (
            <View style={styles.zeroBadge}>
              <Text style={[styles.zeroBadgeText, RTL_TEXT]}>لا يوجد رصيد</Text>
            </View>
          )}
        </View>

        {/* Active purchases list */}
        {purchases.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: textColor }, RTL_TEXT]}>باقاتي النشطة</Text>
            {purchases.map((p) => {
              const remaining = p.creditsTotal - p.creditsUsed;
              const progress = Math.min(100, (p.creditsUsed / p.creditsTotal) * 100);
              return (
                <View key={p.id} style={[styles.purchaseCard, { backgroundColor: cardBg }]}>
                  <View style={styles.purchaseHeader}>
                    <Text style={[styles.purchaseName, { color: '#D4AF37' }, RTL_TEXT]}>
                      {p.package.name}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.statusText, { color: '#16A34A' }, RTL_TEXT]}>نشطة</Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <StatBox
                      label="المتبقي"
                      value={`${RLM}${remaining}${RLM} إعلان`}
                      color="#3B82F6"
                    />
                    <StatBox
                      label="المستخدم"
                      value={`${RLM}${p.creditsUsed}${RLM} / ${RLM}${p.creditsTotal}${RLM}`}
                      color={remaining === 0 ? '#EF4444' : '#16A34A'}
                    />
                  </View>

                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Available packages */}
        <Text style={[styles.sectionTitle, { color: textColor }, RTL_TEXT]}>
          {purchases.length > 0 ? 'إضافة رصيد' : 'اختر باقة إعلانات'}
        </Text>

        {packages.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: cardBg }]}>
            <Ionicons name="cube-outline" size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: textColor }, RTL_TEXT]}>لا توجد باقات متاحة</Text>
            <Text style={[styles.emptySub, { color: mutedColor }, RTL_TEXT]}>
              سيتم إضافة باقات قريباً
            </Text>
          </View>
        )}

        {packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.pkgCard,
              {
                backgroundColor: cardBg,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
              },
            ]}
            onPress={() => handlePurchase(pkg)}
            activeOpacity={0.8}
            disabled={purchasing}
          >
            {/* Listing count badge */}
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{pkg.listingCount}</Text>
              <Text style={styles.countBadgeLabel}>إعلان</Text>
            </View>

            <View style={styles.pkgInfo}>
              <Text style={[styles.pkgName, { color: textColor }, RTL_TEXT]}>{pkg.name}</Text>
              {pkg.description && (
                <Text style={[styles.pkgDesc, { color: mutedColor }, RTL_TEXT]}>{pkg.description}</Text>
              )}
              <View style={styles.pkgFeature}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={[styles.featureText, { color: mutedColor }, RTL_TEXT]}>
                  {RLM}{pkg.listingCount}{RLM} إعلان نشط
                </Text>
              </View>
              <View style={styles.pkgFeature}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={[styles.featureText, { color: mutedColor }, RTL_TEXT]}>
                  دفع مرة واحدة
                </Text>
              </View>
            </View>

            <View style={styles.pkgPriceCol}>
              <Text style={[styles.pkgPrice, RTL_TEXT]}>
                {RLM}{Number(pkg.price).toFixed(3)}{RLM}
              </Text>
              <Text style={[styles.pkgCurrency, { color: mutedColor }, RTL_TEXT]}>د.ب</Text>

              <View style={styles.buyBtn}>
                {purchasing ? (
                  <ActivityIndicator color="#0A0B14" size="small" />
                ) : (
                  <Text style={[styles.buyBtnText, RTL_TEXT]}>شراء</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
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
  value: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  label: { fontSize: 11, color: '#94A3B8' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 12,
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

  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
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
  balanceIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceInfo: { flex: 1 },
  balanceLabel: { fontSize: 12, marginBottom: 4 },
  balanceValue: { fontSize: 22, fontWeight: '900' },
  zeroBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zeroBadgeText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, marginTop: 4 },

  purchaseCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  purchaseHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseName: { fontSize: 16, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row-reverse', marginBottom: 12 },
  progressBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#D4AF37', borderRadius: 4 },

  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14 },

  pkgCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      default: {
        shadowColor: '#0A0F1E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 5,
      },
    }),
  },
  countBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212,175,55,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  countBadgeText: { fontSize: 20, fontWeight: '900', color: '#D4AF37' },
  countBadgeLabel: { fontSize: 10, color: '#D4AF37', fontWeight: '700' },

  pkgInfo: { flex: 1 },
  pkgName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  pkgDesc: { fontSize: 12, marginBottom: 6 },
  pkgFeature: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginBottom: 2 },
  featureText: { fontSize: 12 },

  pkgPriceCol: { alignItems: 'center', minWidth: 72 },
  pkgPrice: { fontSize: 20, fontWeight: '900', color: '#D4AF37' },
  pkgCurrency: { fontSize: 11, marginBottom: 8 },
  buyBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
  },
  buyBtnText: { fontSize: 13, fontWeight: '900', color: '#0A0B14' },
});
