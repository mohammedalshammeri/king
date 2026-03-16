import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';

interface ComplaintItem {
  id: string;
  reason: string;
  details?: string | null;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolution?: string | null;
  createdAt: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'مفتوحة', color: '#b45309', bg: '#fef3c7' },
  UNDER_REVIEW: { label: 'قيد المراجعة', color: '#475569', bg: '#e2e8f0' },
  RESOLVED: { label: 'تم الحل', color: '#15803d', bg: '#dcfce7' },
  DISMISSED: { label: 'مغلقة', color: '#b91c1c', bg: '#fee2e2' },
};

export default function ComplaintsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [items, setItems] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const theme = {
    background: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#111827' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#1f2937' : '#e2e8f0',
    surface: isDark ? '#0b1220' : '#f8fafc',
    primary: '#D4AF37',
  };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/my', { params: { type: 'COMPLAINT' } });
      const data = response.data?.data;
      setItems((Array.isArray(data) ? data : data?.items) ?? []);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        Alert.alert('تنبيه', 'يرجى تسجيل الدخول أولاً');
        router.push('/(auth)/login');
      } else {
        Alert.alert('خطأ', 'تعذر تحميل الشكاوى');
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        router.push('/(auth)/login');
        return;
      }
      loadComplaints();
    }, [isAuthenticated])
  );

  const handleSubmit = async () => {
    if (title.trim().length < 5) {
      Alert.alert('تنبيه', 'يرجى كتابة عنوان الشكوى (على الأقل 5 أحرف)');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reports', {
        type: 'COMPLAINT',
        reason: title.trim(),
        details: details.trim() || undefined,
      });
      setTitle('');
      setDetails('');
      Alert.alert('تم الإرسال', 'تم إرسال الشكوى بنجاح');
      await loadComplaints();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'فشل إرسال الشكوى';
      if (error?.response?.status === 401) {
        Alert.alert('تنبيه', 'يرجى تسجيل الدخول أولاً');
        router.push('/(auth)/login');
        return;
      }
      Alert.alert('خطأ', Array.isArray(message) ? message[0] : message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <PageHeader
        title="الشكاوى"
        variant="gradient"
        onBack={() => router.replace('/profile')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>إرسال شكوى جديدة</Text>
          <TextInput
            placeholder="عنوان الشكوى"
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            placeholderTextColor={theme.textMuted}
          />
          <TextInput
            placeholder="تفاصيل الشكوى (اختياري)"
            value={details}
            onChangeText={setDetails}
            style={[styles.input, styles.textArea, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            placeholderTextColor={theme.textMuted}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>إرسال الشكوى</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.cardSpacing, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>متابعة الشكاوى</Text>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator style={styles.loadingIcon} />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>جاري التحميل...</Text>
            </View>
          ) : items.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>لا توجد شكاوى حتى الآن</Text>
          ) : (
            items.map((item) => {
              const status = statusMap[item.status] || statusMap.OPEN;
              return (
                <View key={item.id} style={[styles.ticketCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.ticketHeader}>
                    <Text style={[styles.ticketTitle, { color: theme.text }]} numberOfLines={2}>{item.reason}</Text>
                    <View style={[styles.badge, { backgroundColor: status.bg }]}
                      >
                      <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.ticketDate, { color: theme.textMuted }]}>{new Date(item.createdAt).toLocaleDateString('ar')}</Text>
                  {item.details ? (
                    <Text style={[styles.ticketDetails, { color: theme.textMuted }]} numberOfLines={3}>{item.details}</Text>
                  ) : null}
                  {item.resolution ? (
                    <View style={[styles.resolutionBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.resolutionLabel, { color: theme.primary }]}>رد الإدارة</Text>
                      <Text style={[styles.resolutionText, { color: theme.text }]}>{item.resolution}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardSpacing: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'right',
  },
  textArea: {
    minHeight: 90,
  },
  submitButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    color: '#64748b',
  },
  loadingIcon: {
    marginLeft: 8,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'right',
    paddingVertical: 10,
  },
  ticketCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  ticketHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
  },
  ticketDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'right',
  },
  ticketDetails: {
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resolutionBox: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'right',
  },
  resolutionText: {
    fontSize: 13,
    color: '#0f172a',
    marginTop: 4,
    textAlign: 'right',
  },
});
