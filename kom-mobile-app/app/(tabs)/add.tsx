import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { useTheme } from '../../context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';

type ListingType = 'CAR' | 'PLATE' | 'PART' | 'MOTORCYCLE';

interface TypeOption {
  type: ListingType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const typeOptions: TypeOption[] = [
  { type: 'CAR', title: 'سيارة', description: 'بيع سيارة جديدة أو مستعملة', icon: 'car-sport' },
  { type: 'MOTORCYCLE', title: 'دراجة نارية', description: 'بيع دراجة نارية', icon: 'bicycle' },
  { type: 'PLATE', title: 'لوحة مميزة', description: 'بيع لوحة أرقام مميزة', icon: 'document-text' },
  { type: 'PART', title: 'قطعة غيار', description: 'بيع قطع غيار سيارات', icon: 'settings' },
];

export default function AddListingScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<ListingType | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const theme = {
    background: isDark ? Colors.dark.background : Colors.background,
    card: isDark ? Colors.dark.surface : Colors.surface,
    text: isDark ? Colors.dark.text : Colors.text,
    textMuted: isDark ? '#94a3b8' : Colors.textSecondary,
    border: isDark ? '#1f2937' : Colors.border,
    primary: Colors.primary,
  };

  const getDraftTitle = (type: ListingType) => {
    switch (type) {
      case 'CAR':
        return 'مسودة إعلان سيارة';
      case 'MOTORCYCLE':
        return 'مسودة إعلان دراجة';
      case 'PLATE':
        return 'مسودة إعلان لوحة';
      case 'PART':
        return 'مسودة إعلان قطعة';
      default:
        return 'مسودة إعلان جديد';
    }
  };

  const handleTypeSelect = async (type: ListingType) => {
    setSelectedType(type);

    if (!isAuthenticated) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'يجب تسجيل الدخول أولاً لإضافة إعلان',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل الدخول', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.post('/listings', {
        type,
        title: getDraftTitle(type),
        price: 0,
        currency: 'BHD',
      });

      const listingId = response.data.data.id;

      router.push({ pathname: '/add-listing/[id]', params: { id: listingId, type } });
    } catch (error: any) {
      console.error('Failed to create draft listing:', error);
      Alert.alert('خطأ', error.response?.data?.message || 'فشل إنشاء الإعلان. حاول مرة أخرى', [{ text: 'حسناً' }]);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader
        title="إضافة إعلان جديد"
        variant="gradient"
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.optionsContainer}>
          {typeOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.optionCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                selectedType === option.type && [styles.optionCardSelected, { borderColor: theme.primary }],
              ]}
              onPress={() => handleTypeSelect(option.type)}
              disabled={isCreating}
            >
              <View style={styles.optionIcon}>
                <Ionicons
                  name={option.icon}
                  size={40}
                  color={selectedType === option.type ? theme.primary : theme.textMuted}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>{option.title}</Text>
                <Text style={[styles.optionDescription, { color: theme.textMuted }]}>{option.description}</Text>
              </View>
              {selectedType === option.type && isCreating && (
                <ActivityIndicator size="small" color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#071e3b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    backgroundColor: '#0b1835',
  },
  optionIcon: {
    marginLeft: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'right',
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'right',
  },
});
