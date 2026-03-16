import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../../context/ThemeContext';
import { PageHeader } from '../../../components/ui/page-header';
import api from '../../../services/api';

interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PENDING_PROOF' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentType?: string;
  createdAt: string;
  listing?: { id: string; title: string; status: string } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PAID:          { label: 'مدفوع',         color: '#16A34A', bg: '#DCFCE7' },
  PENDING:       { label: 'معلق',         color: '#D97706', bg: '#FEF3C7' },
  PENDING_PROOF: { label: 'قيد المراجعة', color: '#7C3AED', bg: '#EDE9FE' },
  FAILED:        { label: 'فشل',          color: '#DC2626', bg: '#FEE2E2' },
  REFUNDED:      { label: 'مسترجع',       color: '#6B7280', bg: '#F3F4F6' },
};

export default function PaymentsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceTx, setInvoiceTx] = useState<any>(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);

  const bg       = isDark ? '#0B0F1E' : '#F2F5FC';
  const cardBg   = isDark ? '#111827' : '#FFFFFF';
  const textColor = isDark ? '#F8FAFC' : '#0A0B14';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    api.get('/payments/my-transactions')
      .then((r) => {
        const payload = r.data?.data ?? r.data ?? [];
        if (Array.isArray(payload)) setTransactions(payload);
        else setTransactions([]);
      })
      .catch((err) => {
        console.error('payments/my-transactions error', err);
        setTransactions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = transactions
    .filter((t) => t.status === 'PAID')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const renderItem = ({ item }: { item: PaymentTransaction }) => {
    const st = STATUS_MAP[item.status] ?? STATUS_MAP.PENDING;
    const canUploadProof = item.status === 'PENDING';
    return (
      <View style={[styles.txCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.txRow}>
          <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
          <Text style={[styles.amount, { color: textColor }]}>
            {Number(item.amount).toFixed(3)} {item.currency}
          </Text>
        </View>
        {item.listing && (
          <Text style={[styles.listingTitle, { color: textColor }]} numberOfLines={1}>
            {item.listing.title}
          </Text>
        )}
        <Text style={[styles.dateText, { color: mutedColor }]}>
          {new Date(item.createdAt).toLocaleDateString('ar-BH', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </Text>
        {canUploadProof && (
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/profile/payment-proof' as any,
                params: {
                  transactionId: item.id,
                  amount: String(item.amount),
                  currency: item.currency,
                  paymentType: item.paymentType ?? 'LISTING_FEE',
                },
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.uploadBtnText}>رفع إثبات الدفع</Text>
          </TouchableOpacity>
        )}
        {item.status === 'PAID' && (
          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: 'rgba(16,185,129,0.12)', marginTop: 8 }]}
            onPress={() => handleDownloadInvoice(item.id)}
            activeOpacity={0.8}
            disabled={loadingInvoiceId === item.id}
          >
            {loadingInvoiceId === item.id ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Text style={[styles.uploadBtnText, { color: '#10B981' }]}>عرض الفاتورة</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  async function handleDownloadInvoice(transactionId: string) {
    try {
      setLoadingInvoiceId(transactionId);
      const res = await api.get(`/payments/transaction/${transactionId}`);
      const tx = res?.data?.data ?? res?.data;
      if (!tx) throw new Error('لم يتم العثور على بيانات المعاملة');
      setInvoiceTx(tx);
    } catch (err: any) {
      console.error('download invoice error', err);
      Alert.alert('خطأ', err?.message || 'فشل تحميل الفاتورة');
    } finally {
      setLoadingInvoiceId(null);
    }
  }

  async function shareInvoice() {
    if (!invoiceTx) return;
    try {
      const amount = Number(invoiceTx.amount ?? 0).toFixed(3);
      const currency = invoiceTx.currency ?? 'BHD';
      const serviceType = PAYMENT_TYPE_LABELS[invoiceTx.paymentType] ?? invoiceTx.paymentType ?? 'دفع';
      const dateStr = new Date(invoiceTx.paidAt ?? invoiceTx.createdAt ?? Date.now())
        .toLocaleDateString('ar-BH', { year: 'numeric', month: 'long', day: 'numeric' });
      const txId = (invoiceTx.id ?? '').slice(0, 20) + '…';

      const rows = [
        { k: 'رقم المعاملة', v: txId },
        { k: 'نوع الخدمة', v: serviceType },
        { k: 'تاريخ الدفع', v: dateStr },
        ...(invoiceTx.listing?.title ? [{ k: 'الإعلان', v: invoiceTx.listing.title }] : []),
        ...(invoiceTx.providerRef ? [{ k: 'مرجع الدفع', v: invoiceTx.providerRef }] : []),
      ];

      const rowsHtml = rows.map(r => `
        <tr>
          <td style="padding:12px 16px;color:#64748B;font-size:13px;text-align:right;border-bottom:1px solid #F1F5F9;">${r.k}</td>
          <td style="padding:12px 16px;color:#0A0B14;font-size:13px;font-weight:600;text-align:left;border-bottom:1px solid #F1F5F9;">${r.v}</td>
        </tr>`).join('');

      const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاتورة KOM</title>
</head>
<body style="margin:0;padding:20px;background:#F2F5FC;font-family:Arial,Helvetica,sans-serif;direction:rtl;">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0E1830,#162444);padding:28px 24px;text-align:center;">
      <img src="https://res.cloudinary.com/dusyeyipu/image/upload/v1772134340/kom-platform/kom-logo.png"
           alt="KOM" style="width:80px;height:80px;border-radius:40px;object-fit:cover;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
      <p style="margin:0;color:#D4AF37;font-size:13px;">منصة KOM للسيارات</p>
      <h2 style="margin:8px 0 0;color:#FFFFFF;font-size:20px;font-weight:800;">فاتورة رسمية</h2>
    </div>

    <!-- Dashed -->
    <div style="border-top:2px dashed #CBD5E1;margin:0 24px;"></div>

    <!-- Amount -->
    <div style="text-align:center;padding:20px 24px;">
      <p style="margin:0 0 8px;color:#64748B;font-size:13px;">المبلغ المدفوع</p>
      <p style="margin:0;font-size:44px;font-weight:900;color:#D4AF37;">${amount} <span style="font-size:22px;color:#94A3B8;font-weight:600;">${currency}</span></p>
      <div style="display:inline-flex;align-items:center;gap:6px;background:#DCFCE7;padding:6px 18px;border-radius:20px;margin-top:14px;">
        <span style="color:#16A34A;font-size:16px;">&#10003;</span>
        <span style="color:#16A34A;font-size:13px;font-weight:700;">تم الدفع بنجاح</span>
      </div>
    </div>

    <!-- Dashed -->
    <div style="border-top:2px dashed #CBD5E1;margin:0 24px;"></div>

    <!-- Details -->
    <div style="padding:8px 0;">
      <table style="width:100%;border-collapse:collapse;">
        ${rowsHtml}
      </table>
    </div>

    <!-- Dashed -->
    <div style="border-top:2px dashed #CBD5E1;margin:0 24px;"></div>

    <!-- Footer -->
    <div style="text-align:center;padding:18px 24px 24px;background:#F8FAFC;">
      <p style="margin:0 0 4px;color:#64748B;font-size:13px;">شكراً لاستخدامك منصة KOM</p>
      <p style="margin:0;color:#D4AF37;font-size:12px;font-weight:700;">kom.bh</p>
    </div>
  </div>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'مشاركة فاتورة KOM',
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      console.error('shareInvoice error', err);
      Alert.alert('خطأ', 'فشل تصدير الفاتورة');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0E1830' }]} edges={['left', 'right', 'bottom']}>
      <StatusBar style='light' />

      <PageHeader
        title="مدفوعاتي"
        variant="gradient"
        onBack={() => router.back()}
      />

      <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Summary card */}
      <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#D4AF37' }]}>
            {totalPaid.toFixed(3)} د.ب
          </Text>
          <Text style={[styles.summaryLabel, { color: mutedColor }]}>إجمالي المدفوع</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: textColor }]}>
            {transactions.filter((t) => t.status === 'PAID').length}
          </Text>
          <Text style={[styles.summaryLabel, { color: mutedColor }]}>عمليات ناجحة</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: textColor }]}>
            {transactions.length}
          </Text>
          <Text style={[styles.summaryLabel, { color: mutedColor }]}>إجمالي العمليات</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 40 }} />
      ) : transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cash-outline" size={56} color="#D4AF37" style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>لا توجد مدفوعات</Text>
          <Text style={[styles.emptySub, { color: mutedColor }]}>
            لم يتم إجراء أي عمليات دفع بعد
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      </View>

      {/* ══ Invoice Modal ══ */}
      <Modal
        visible={!!invoiceTx}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInvoiceTx(null)}
        statusBarTranslucent
      >
        <Pressable style={inv.overlay} onPress={() => setInvoiceTx(null)}>
          <Pressable style={inv.sheet} onPress={() => {}}>

            {/* Close */}
            <TouchableOpacity style={inv.closeBtn} onPress={() => setInvoiceTx(null)}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* Header */}
            <View style={inv.header}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={inv.logoImage}
                contentFit="cover"
              />
              <Text style={inv.brandName}>منصة KOM للسيارات</Text>
              <Text style={inv.invoiceLabel}>فاتورة رسمية</Text>
            </View>

            {/* Dashed */}
            <View style={inv.dashed} />

            {/* Amount */}
            <View style={inv.amountSection}>
              <Text style={inv.amountLabel}>المبلغ المدفوع</Text>
              <Text style={inv.amountValue}>
                {Number(invoiceTx?.amount ?? 0).toFixed(3)}
                <Text style={inv.amountCurrency}> {invoiceTx?.currency ?? 'BHD'}</Text>
              </Text>
              <View style={inv.paidBadge}>
                <Ionicons name="checkmark-circle" size={15} color="#16A34A" />
                <Text style={inv.paidText}>تم الدفع بنجاح</Text>
              </View>
            </View>

            {/* Dashed */}
            <View style={inv.dashed} />

            {/* Details */}
            <View style={inv.details}>
              <InvRow k="رقم المعاملة" v={(invoiceTx?.id ?? '').slice(0, 18) + '…'} />
              <InvRow k="نوع الخدمة" v={PAYMENT_TYPE_LABELS[invoiceTx?.paymentType] ?? invoiceTx?.paymentType ?? 'دفع'} />
              <InvRow
                k="تاريخ الدفع"
                v={new Date(invoiceTx?.paidAt ?? invoiceTx?.createdAt ?? Date.now()).toLocaleDateString('ar-BH', { year: 'numeric', month: 'long', day: 'numeric' })}
              />
              {invoiceTx?.listing?.title && <InvRow k="الإعلان" v={invoiceTx.listing.title} />}
              {invoiceTx?.providerRef && <InvRow k="مرجع الدفع" v={invoiceTx.providerRef} />}
            </View>

            {/* Dashed */}
            <View style={inv.dashed} />

            {/* Footer */}
            <View style={inv.footer}>
              <Text style={inv.footerLine1}>شكراً لاستخدامك منصة KOM</Text>
              <Text style={inv.footerLine2}>kom.bh</Text>
            </View>

            {/* Share */}
            <TouchableOpacity style={inv.shareBtn} onPress={shareInvoice} activeOpacity={0.85}>
              <Ionicons name="share-social-outline" size={18} color="#D4AF37" />
              <Text style={inv.shareBtnText}>مشاركة الفاتورة</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  summaryCard: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      default: { shadowColor: '#1A2050', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
    }),
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  summaryLabel: { fontSize: 11, textAlign: 'center' },
  summaryDivider: { width: 1, marginHorizontal: 8 },

  listContent: { padding: 16, paddingTop: 0, paddingBottom: 48 },

  txCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    ...Platform.select({
      default: { shadowColor: '#1A2050', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    }),
  },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  amount: { fontSize: 18, fontWeight: '800' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  listingTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4, textAlign: 'right' },
  dateText: { fontSize: 12, textAlign: 'right' },
  uploadBtn: { marginTop: 10, backgroundColor: 'rgba(212,175,55,0.12)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  uploadBtnText: { color: '#D4AF37', fontSize: 13, fontWeight: '700' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center' },
});

// ─── Invoice header constants ────────────────────────────────────
const PAYMENT_TYPE_LABELS: Record<string, string> = {
  LISTING_FEE:           'رسوم نشر إعلان',
  FEATURED_LISTING:      'إعلان مميز',
  SHOWROOM_SUBSCRIPTION: 'اشتراك معرض',
  INDIVIDUAL_PACKAGE:    'باقة فردية',
};

function InvRow({ k, v }: { k: string; v: string }) {
  return (
    <View style={inv.row}>
      <Text style={inv.rowValue} numberOfLines={1}>{v}</Text>
      <Text style={inv.rowKey}>{k}</Text>
    </View>
  );
}

const inv = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 44,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    backgroundColor: '#0E1830',
  },
  brandName: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'center',
  },
  invoiceLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A0B14',
    textAlign: 'center',
  },
  dashed: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginVertical: 16,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  amountLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#D4AF37',
    textAlign: 'center',
  },
  amountCurrency: {
    fontSize: 20,
    fontWeight: '600',
    color: '#94A3B8',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  paidText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
  },
  details: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowKey: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'right',
    minWidth: 80,
  },
  rowValue: {
    fontSize: 13,
    color: '#0A0B14',
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
    paddingLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  footerLine1: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  footerLine2: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
    textAlign: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0E1830',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 20,
  },
  shareBtnText: {
    color: '#D4AF37',
    fontSize: 15,
    fontWeight: '800',
  },
});
