import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { useAppTranslation, useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';

interface Listing {
  id: string;
  type: 'CAR' | 'PLATE' | 'PART';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'SOLD' | 'REJECTED' | 'ARCHIVED';
  title: string;
  price: number | string; // Can be Decimal string from backend
  currency: string;
  locationGovernorate?: string;
  viewsCount: number;
  favoritesCount: number;
  postedAt?: string;
  media: Array<{
    id: string;
    url: string;
    type: string;
  }>;
  rejectionReason?: string;
}

export default function MyListingsScreen() {
  const { isAuthenticated } = useAuthStore();
  const { isDark } = useTheme();
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_REVIEW' | 'SOLD'>('ALL');

  const theme = {
    background: isDark ? '#0B0F1E' : '#F2F5FC',
    surface:    isDark ? '#111827' : '#FFFFFF',
    card:       isDark ? '#111827' : '#FFFFFF',
    border:     isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    text:       isDark ? '#F8FAFC' : '#0A0B14',
    textMuted:  isDark ? '#64748B' : '#94A3B8',
    subText:    isDark ? '#CBD5E1' : '#6B7280',
    primary: Colors.primary,
  };

  const dirText = { textAlign: (isRTL ? 'right' : 'left') as 'left' | 'right' };
  const rowDirection = { flexDirection: (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse' };

  const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: t('myListings.statusDraft'), color: '#64748B', bg: '#F1F5F9' },
    PENDING_REVIEW: { label: t('myListings.statusPendingReview'), color: '#F59E0B', bg: '#FEF3C7' },
    ACTIVE: { label: t('myListings.statusActive'), color: '#10B981', bg: '#D1FAE5' },
    SOLD: { label: t('myListings.statusSold'), color: '#6366F1', bg: '#E0E7FF' },
    REJECTED: { label: t('myListings.statusRejected'), color: '#EF4444', bg: '#FEE2E2' },
    EXPIRED: { label: t('myListings.statusExpired'), color: '#9CA3AF', bg: '#F3F4F6' },
  };

  const getDisplayStatus = (status: Listing['status']) => {
    if (status === 'APPROVED') return 'ACTIVE';
    if (status === 'ARCHIVED') return 'EXPIRED';
    return status;
  };

  const fetchListings = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await api.get('/listings/my/all');
      const items = response.data?.data || [];
      setListings(items.filter((item: Listing) => item.status !== 'ARCHIVED'));
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      if (error.response?.status !== 401) {
        Alert.alert(t('common.error'), t('myListings.loadFailed'));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchListings();
      }
    }, [isAuthenticated])
  );

  const handleDelete = async (listingId: string) => {
    Alert.alert(
      t('myListings.deleteTitle'),
      t('myListings.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('myListings.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/listings/${listingId}`);
              setListings(listings.filter(l => l.id !== listingId));
              fetchListings(true);
              Alert.alert(t('common.success'), t('myListings.deleteSuccess'));
            } catch {
              Alert.alert(t('common.error'), t('myListings.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const handleEdit = (listing: Listing) => {
    router.push({
      pathname: '/add-listing/[id]',
      params: { id: listing.id, type: listing.type, mode: 'edit' },
    });
  };

  const handleMarkAsSold = async (listingId: string) => {
    Alert.alert(
      t('myListings.soldTitle'),
      t('myListings.soldMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('myListings.confirmYes'),
          onPress: async () => {
            try {
              await api.post(`/listings/${listingId}/mark-sold`);
              fetchListings();
              Alert.alert(t('common.success'), t('myListings.soldSuccess'));
            } catch {
              Alert.alert(t('common.error'), t('myListings.updateFailed'));
            }
          },
        },
      ]
    );
  };

  const filteredListings = listings.filter(listing => {
    if (filter === 'ALL') return true;
    return getDisplayStatus(listing.status) === filter;
  });

  const renderListingCard = ({ item }: { item: Listing }) => {
    const displayStatus = getDisplayStatus(item.status);
    const statusInfo = statusLabels[displayStatus] || statusLabels.DRAFT;
    const thumbnail = (item.media?.find((m: any) => m?.type === 'IMAGE' || m?.type === 'image') ?? item.media?.[0])?.url;
    const canEdit = item.status === 'DRAFT' || item.status === 'REJECTED' || item.status === 'APPROVED';

    const typeAccent =
      (item.type as string) === 'MOTORCYCLE' ? '#8B5CF6' :
      item.type === 'PLATE'                  ? '#059669' :
      item.type === 'PART'                   ? '#F59E0B' :
      '#3B82F6';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card }]}
        activeOpacity={0.85}
        onPress={() => {
          if (item.status === 'DRAFT') {
            router.push({ pathname: '/add-listing/[id]', params: { id: item.id, type: item.type, mode: 'edit' } });
          } else {
            router.push({ pathname: '/listing/[id]', params: { id: item.id } });
          }
        }}
      >
        {/* Colored accent bar top */}
        <View style={{ height: 3, backgroundColor: typeAccent, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />

        <View style={styles.cardContent}>
          <View style={styles.thumbnailWrapper}>
            {thumbnail ? (
              <Image source={{ uri: thumbnail }} style={styles.thumbnail} contentFit="cover" />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: typeAccent + '18' }]}>
                <Ionicons name="car-outline" size={32} color={typeAccent} />
              </View>
            )}
            <View style={styles.watermarkContainer} pointerEvents="none">
              <Image source={require('@/assets/images/logo.png')} style={styles.watermarkImage} contentFit="contain" />
            </View>
          </View>

          <View style={styles.cardInfo}>
            <View style={[styles.cardHeader, rowDirection]}>
              <Text style={[styles.cardTitle, { color: theme.text }, dirText]} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardPrice, { color: theme.primary }, dirText]}>
              {item.price 
                ? (typeof item.price === 'number' 
                    ? item.price.toFixed(3) 
                    : (isNaN(parseFloat(item.price)) ? '0.000' : parseFloat(item.price).toFixed(3)))
                : '0.000'} {item.currency || 'BHD'}
            </Text>

            {item.locationGovernorate && (
              <View style={[styles.cardLocation, rowDirection]}>
                <Ionicons name="location-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.cardLocationText, { color: theme.textMuted }, dirText]}>{item.locationGovernorate}</Text>
              </View>
            )}

            {item.status === 'APPROVED' && (
              <View style={[styles.cardStats, rowDirection]}>
                <View style={[styles.stat, rowDirection]}>
                  <Ionicons name="eye-outline" size={16} color={theme.textMuted} />
                  <Text style={[styles.statText, { color: theme.textMuted }, dirText]}>{item.viewsCount}</Text>
                </View>
                <View style={[styles.stat, rowDirection]}>
                  <Ionicons name="heart-outline" size={16} color={theme.textMuted} />
                  <Text style={[styles.statText, { color: theme.textMuted }, dirText]}>{item.favoritesCount}</Text>
                </View>
              </View>
            )}

            {item.status === 'REJECTED' && item.rejectionReason && (
              <View style={[styles.rejectionBox, { backgroundColor: isDark ? '#3b1f1f' : '#FEE2E2' }, rowDirection]}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={[styles.rejectionText, dirText]} numberOfLines={2}>
                  {item.rejectionReason}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.cardActions, { borderTopColor: theme.border }, rowDirection]}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.actionButton, rowDirection]}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                handleEdit(item);
              }}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.primary }, dirText]}>
                {item.status === 'DRAFT' ? t('myListings.complete') : t('myListings.edit')}
              </Text>
            </TouchableOpacity>
          )}

          {item.status === 'APPROVED' && (
            <TouchableOpacity
              style={[styles.actionButton, rowDirection]}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                handleMarkAsSold(item.id);
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text style={[styles.actionButtonText, { color: '#10B981' }, dirText]}>{t('myListings.soldAction')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, rowDirection]}
            onPress={(e: any) => {
              e?.stopPropagation?.();
              handleDelete(item.id);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }, dirText]}>{t('myListings.deleteAction')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }, dirText]}>{t('myListings.loginRequired')}</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }, dirText]}>
            {t('myListings.loginRequiredMessage')}
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>{t('myListings.loginAction')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader
        title={t('tabs.myListings')}
        variant="gradient"
        onBack={() => router.replace('/profile')}
        rightSlot={(
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/add')}>
            <Ionicons name="add-circle" size={28} color="#D4AF37" />
          </TouchableOpacity>
        )}
      />

      <View style={[styles.filterContainer, rowDirection]}>
        {[
          { key: 'ALL', label: t('myListings.allFilter') },
          { key: 'ACTIVE', label: t('myListings.statusActive') },
          { key: 'PENDING_REVIEW', label: t('myListings.statusPendingReview') },
          { key: 'SOLD', label: t('myListings.soldAction') },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
            onPress={() => setFilter(f.key as any)}
          >
            <Text style={[styles.filterButtonText, filter === f.key && styles.filterButtonTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredListings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }, dirText]}>{t('myListings.noListings')}</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }, dirText]}>
            {filter === 'ALL'
              ? t('myListings.noListingsYet')
              : t('myListings.noListingsWithFilter', {
                  status:
                    filter === 'ACTIVE'
                      ? t('myListings.filterActive')
                      : filter === 'PENDING_REVIEW'
                      ? t('myListings.filterPendingReview')
                      : t('myListings.filterSold'),
                })}
          </Text>
          {filter === 'ALL' && (
            <TouchableOpacity
              style={[styles.addNewButton, rowDirection]}
              onPress={() => router.push('/(tabs)/add')}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addNewButtonText}>{t('myListings.addNewListing')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchListings(true)}
              colors={[theme.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#0E1830',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterButtonActive: {
    backgroundColor: '#D4AF37',
  },
  filterButtonText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#0A0B14',
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  addNewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#1A2050',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  thumbnailWrapper: {
    width: 110,
    height: 110,
    borderRadius: 12,
    marginEnd: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  watermarkImage: {
    width: 40,
    height: 40,
    opacity: 0.3,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'auto',
    marginEnd: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
    textAlign: 'auto',
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardLocationText: {
    fontSize: 12,
    color: '#64748B',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
    gap: 8,
    marginTop: 8,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'auto',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 4,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 5,
    borderRadius: 8,
    margin: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
