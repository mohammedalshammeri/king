import React, { useEffect, useState, useRef, useCallback } from 'react';
import AdsBanner from '@/components/ads/AdsBanner';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Dimensions, FlatList, Alert, Linking, Platform, Modal } from 'react-native';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useAppTranslation, useLanguage } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { PageHeader } from '@/components/ui/page-header';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = width * 1.1; // Make it taller for luxury feel
const THUMB_SIZE = 60;

type ListingType = 'CAR' | 'PLATE' | 'PART' | 'MOTORCYCLE' | string;

interface MediaItem {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  thumbnailUrl?: string;
  mimeType?: string;
}

// Helper component for Media Items to allow hooks usage
// NOTE: useVideoPlayer must always be called at the top level (Rules of Hooks).
// We pass an empty string when item is not a video — the player stays idle.
const ListingMediaItem = React.memo(({ item }: { item: MediaItem }) => {
  const player = useVideoPlayer(item.type === 'VIDEO' ? item.url : '', (p) => {
    p.loop = true;
  });

  if (item.type === 'VIDEO') {
    return (
      <View style={styles.mediaContainer}>
        <VideoView
          style={styles.video}
          player={player}
          nativeControls
          contentFit="contain"
        />
        {/* Watermark Overlay */}
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.watermarkImage}
            contentFit="contain"
          />
        </View>
      </View>
    );
  }

  // Image handling
  return (
    <View style={styles.mediaContainer}>
      <Image
        source={{ uri: item.url }}
        style={styles.image}
        contentFit="contain"
      />
      {/* Watermark Overlay */}
      <View style={styles.watermarkContainer} pointerEvents="none">
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.watermarkImage}
          contentFit="contain"
        />
      </View>
    </View>
  );
});

interface ListingDetail {
  id: string;
  adNumber: string;
  ownerId?: string | null;
  title: string;
  price: number;
  description: string;
  media: MediaItem[];
  location: string;
  locationGovernorate?: string;
  locationArea?: string;
  type: ListingType;
  viewsCount: number;
  user: {
    name: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
  postedAt: string;
  carDetails?: any;
  motorcycleDetails?: any;
  plateDetails?: any;
  partDetails?: any;
}

interface FeaturedPackage {
  id: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  price: number;
  durationDays: number;
}

function normalizeListing(raw: any): ListingDetail {
  const rawMedia: any[] = Array.isArray(raw?.media) ? raw.media : [];

  let media: MediaItem[] = rawMedia.map((m) => ({
    id: m.id || Math.random().toString(),
    url: m.url,
    type: (m.type === 'VIDEO' || m.mimeType?.startsWith('video/')) ? 'VIDEO' : 'IMAGE',
    thumbnailUrl: m.thumbnailUrl,
    mimeType: m.mimeType,
  }));

  if (media.length === 0) {
    media = [{
      id: 'placeholder',
      url: 'https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image',
      type: 'IMAGE'
    }];
  }

  const owner = raw?.owner;
  const ownerId = raw?.ownerId ?? owner?.id ?? null;
  const ownerName =
    owner?.individualProfile?.fullName ||
    owner?.showroomProfile?.showroomName ||
    owner?.email ||
    raw?.user?.name ||
    '-';

  const showroomPhones = Array.isArray(owner?.showroomProfile?.contactPhones)
    ? owner.showroomProfile.contactPhones
    : [];
  const primaryShowroomPhone = showroomPhones.find((p: any) => p?.isPrimary)?.phone || showroomPhones[0]?.phone;

  const locationGovernorate = raw?.locationGovernorate ?? raw?.location?.governorate;
  const locationArea = raw?.locationArea ?? raw?.location?.area;
  const location = [locationGovernorate, locationArea].filter(Boolean).join(' - ') || raw?.location || '-';

  const normalizedType = String(raw?.type ?? '').toUpperCase();

  const detailsRoot = raw?.details ?? raw?.listingDetails ?? raw?.listing_details ?? null;

  const looksLikeCarDetails = (d: any) =>
    d && (d.make || d.model || d.trim || d.mileageKm || d.transmission || d.fuel || d.bodyType || d.engineSize || d.specs);
  const looksLikeMotorcycleDetails = (d: any) =>
    d && (d.make || d.model || d.year || d.mileageKm || d.engineSize || d.condition);
  const looksLikePlateDetails = (d: any) =>
    d && (d.plateNumber || d.plateCategory || d.plateType || d.plateCode);
  const looksLikePartDetails = (d: any) =>
    d && (d.partCategory || d.partName || d.partNumber || d.brand || d.compatibleCarMake || d.compatibleCarModel);

  const carDetailsRaw = raw?.carDetails ?? detailsRoot?.carDetails ?? raw?.car ?? detailsRoot?.car ?? raw?.car_details;
  const motorcycleDetailsRaw = raw?.motorcycleDetails ?? detailsRoot?.motorcycleDetails ?? raw?.motorcycle ?? detailsRoot?.motorcycle ?? raw?.motorcycle_details;
  const plateDetailsRaw = raw?.plateDetails ?? detailsRoot?.plateDetails ?? raw?.plate ?? detailsRoot?.plate ?? raw?.plate_details;
  const partDetailsRaw = raw?.partDetails ?? detailsRoot?.partDetails ?? raw?.part ?? detailsRoot?.part ?? raw?.part_details;

  const carDetails =
    carDetailsRaw ??
    (normalizedType === 'CAR' && looksLikeCarDetails(detailsRoot) ? detailsRoot : undefined);
  const motorcycleDetails =
    motorcycleDetailsRaw ??
    (normalizedType === 'MOTORCYCLE' && looksLikeMotorcycleDetails(detailsRoot) ? detailsRoot : undefined);
  const plateDetails =
    plateDetailsRaw ??
    (normalizedType === 'PLATE' && looksLikePlateDetails(detailsRoot) ? detailsRoot : undefined);
  const partDetails =
    partDetailsRaw ??
    (normalizedType === 'PART' && looksLikePartDetails(detailsRoot) ? detailsRoot : undefined);

  return {
    id: String(raw?.id ?? ''),
    adNumber: String(raw?.id ?? '').substring(0, 8), // Assuming short ID
    ownerId: ownerId ? String(ownerId) : null,
    title: String(raw?.title ?? ''),
    price: Number(raw?.price ?? 0),
    description: String(raw?.description ?? ''),
    media,
    location,
    locationGovernorate,
    locationArea,
    type: (normalizedType || '-') as ListingType,
    viewsCount: Number(raw?.viewsCount ?? 0),
    user: {
      name: String(ownerName),
      phone: owner?.phone ?? primaryShowroomPhone ?? raw?.user?.phone,
      email: owner?.email ?? raw?.user?.email,
    },
    createdAt: String(raw?.postedAt ?? raw?.createdAt ?? new Date().toISOString()),
    postedAt: String(raw?.postedAt ?? raw?.createdAt ?? new Date().toISOString()),
    carDetails,
    motorcycleDetails,
    plateDetails,
    partDetails,
  };
}

export default function ListingDetailScreen() {
  const { id, backLink } = useLocalSearchParams();
  const listingId = Array.isArray(id) ? id[0] : id;
  const backLinkStr = Array.isArray(backLink) ? backLink[0] : (backLink || '/(tabs)/index');
  const { user, isAuthenticated } = useAuthStore();
  const { isDark } = useTheme();
  const { t } = useAppTranslation();
  const { language, isRTL } = useLanguage();

  // Luxury Theme Colors
  const theme = {
    background: isDark ? '#0A0B14' : '#F2F5FC',
    card: isDark ? '#111C32' : '#FFFFFF',
    text: isDark ? '#F0F4FC' : '#0A0B14',
    textMuted: isDark ? '#8899BB' : '#64748b',
    border: isDark ? '#1E2D4A' : '#EEF2FA',
    primary: '#D4AF37', // Gold for both modes
    secondary: '#D4AF37',
    surface: isDark ? '#0F1829' : '#FFFFFF',
  };

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [featuredPackages, setFeaturedPackages] = useState<FeaturedPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [initiatingFeature, setInitiatingFeature] = useState(false);
  const insets = useSafeAreaInsets();
  const mainListRef = useRef<FlatList>(null);
  const thumbsListRef = useRef<FlatList>(null);
  const dirText = { textAlign: isRTL ? 'right' as const : 'left' as const, writingDirection: isRTL ? 'rtl' as const : 'ltr' as const };
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' as const : 'row' as const };

  const checkFavoriteStatus = useCallback(async () => {
    if (!listingId) return;
    try {
      const response = await api.get(`/listings/${listingId}/favorite-status`);
      setIsFavorited(response.data.isFavorited || false);
      setFavoritesCount(response.data.favoritesCount || 0);
    } catch (err: any) {
      console.warn('Error checking favorite status:', err);
    }
  }, [listingId]);

  useFocusEffect(
    useCallback(() => {
      checkFavoriteStatus();
    }, [checkFavoriteStatus])
  );

  useEffect(() => {
    const fetchListing = async () => {
      try {
        try {
          const response = await api.get(`/listings/${listingId}`);
          const payload = response.data?.data ?? response.data;
          setListing(normalizeListing(payload));
          return;
        } catch (publicErr: any) {
          if (publicErr?.response?.status === 404) {
            const response = await api.get(`/listings/my/${listingId}`);
            const payload = response.data?.data ?? response.data;
            setListing(normalizeListing(payload));
            return;
          }
          throw publicErr;
        }
      } catch (err: any) {
        console.error('Error fetching listing details:', err);
        if (err?.response?.status === 401) {
          setError(t('listing.unavailableAuth'));
        } else if (err?.response?.status === 404) {
          setError(t('listing.unavailable'));
        } else {
          setError(t('listing.loadFailed'));
        }
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId, t]);

  const handleBack = () => {
    router.navigate(backLinkStr as any);
  };

  const handleShare = async () => {
    try {
      if (listing) {
        await Share.share({
          message: t('listing.shareMessage', { title: listing.title, price: listing.price, currency: t('common.bhd') }),
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCall = () => {
    const phone = listing?.user.phone?.toString().trim();
    if (!phone) {
      Alert.alert(t('common.warning'), t('listing.noAdvertiserPhone'));
      return;
    }

    const cleaned = phone.replace(/[^\d+]/g, '');
    const telUrl = Platform.OS === 'web' ? `tel:${cleaned}` : `tel:${cleaned}`;
    Linking.openURL(telUrl).catch(() => {
      Alert.alert(t('common.error'), t('listing.openDialerFailed'));
    });
  };

  const handleWhatsApp = () => {
    const phone = listing?.user.phone?.toString().trim();
    if (!phone) {
      Alert.alert(t('common.warning'), t('listing.noAdvertiserPhone'));
      return;
    }

    const cleaned = phone.replace(/[^\d+]/g, '');
    const waUrl = `https://wa.me/${encodeURIComponent(cleaned)}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert(t('common.error'), t('listing.openWhatsAppFailed'));
    });
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (!listing?.ownerId || !listingId || chatLoading) return;

    setChatLoading(true);
    try {
      const response = await api.post('/chats/start', {
        listingId,
        otherUserId: listing.ownerId,
      });
      const thread = response.data?.data || response.data;
      if (!thread?.id) return;

      router.push({
        pathname: '/chat/[id]',
        params: {
          id: thread.id,
          listingId: listingId || '',
          otherUserId: listing.ownerId,
          otherUserName: listing.user.name,
        },
      });
    } catch (error) {
      console.warn('Failed to start chat', error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!listingId || favoriteLoading) return;

    setFavoriteLoading(true);
    const previousState = isFavorited;
    const previousCount = favoritesCount;

    // Optimistic update
    setIsFavorited(!isFavorited);
    setFavoritesCount(prev => isFavorited ? Math.max(0, prev - 1) : prev + 1);

    try {
      if (previousState) {
        await api.delete(`/listings/${listingId}/favorite`);
      } else {
        await api.post(`/listings/${listingId}/favorite`);
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      // Revert optimistic update on error
      setIsFavorited(previousState);
      setFavoritesCount(previousCount);

      if (err?.response?.status === 401) {
        Alert.alert(t('common.warning'), t('listing.loginToFavorite'));
      } else {
        Alert.alert(t('common.error'), t('listing.favoriteUpdateFailed'));
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleOpenFeatureModal = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    setShowFeatureModal(true);
    if (featuredPackages.length === 0) {
      setLoadingPackages(true);
      try {
        const res = await api.get('/featured-packages');
        const data = res.data?.data ?? res.data;
        setFeaturedPackages(Array.isArray(data) ? data : []);
      } catch {
        Alert.alert(t('common.error'), t('listing.featuredPackagesLoadFailed'));
        setShowFeatureModal(false);
      } finally {
        setLoadingPackages(false);
      }
    }
  };

  const handleSelectPackage = async (pkg: FeaturedPackage) => {
    if (initiatingFeature || !listingId) return;
    setInitiatingFeature(true);
    try {
      const res = await api.post('/payments/featured-listing/initiate', {
        listingId,
        packageId: pkg.id,
      });
      const data = res.data?.data ?? res.data;
      setShowFeatureModal(false);
      router.push({
        pathname: '/(tabs)/profile/payment-proof' as any,
        params: {
          transactionId: data.transaction?.id,
          amount: String(data.transaction?.amount ?? pkg.price),
          currency: 'BHD',
          paymentType: 'FEATURED_LISTING',
        },
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || t('listing.paymentStartFailed');
      Alert.alert(t('common.error'), msg);
    } finally {
      setInitiatingFeature(false);
    }
  };

  const scrollToMedia = (index: number) => {
    setActiveIndex(index);
    mainListRef.current?.scrollToIndex({ index, animated: true });
  };

  const renderThumbnail = ({ item, index }: { item: MediaItem, index: number }) => {
    const isActive = index === activeIndex;
    return (
      <TouchableOpacity
        onPress={() => scrollToMedia(index)}
        style={[styles.thumbnailButton, isActive && styles.thumbnailButtonActive]}
      >
        <Image
          source={{ uri: item.thumbnailUrl || item.url }}
          style={styles.thumbnailImage}
          contentFit="cover"
        />
        {item.type === 'VIDEO' && (
          <View style={styles.thumbVideoBadge}>
            <Ionicons name="videocam" size={12} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index || 0;
      setActiveIndex(newIndex);
      if (listing && listing.media.length > 4) {
        thumbsListRef.current?.scrollToIndex({
          index: newIndex,
          animated: true,
          viewPosition: 0.5
        });
      }
    }
  }, [listing]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, dirText]}>{error || t('listing.unavailable')}</Text>
        <TouchableOpacity style={styles.backButtonSimple} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accentColor =
    listing.type === 'CAR' ? '#3B82F6' :
      listing.type === 'MOTORCYCLE' ? '#8B5CF6' :
        listing.type === 'PLATE' ? '#059669' : '#F59E0B';

  const typeLabel =
    listing.type === 'CAR' ? t('listing.types.car') :
      listing.type === 'MOTORCYCLE' ? t('listing.types.motorcycle') :
        listing.type === 'PLATE' ? t('listing.types.plate') : t('listing.types.part');

  const specs = getListingSpecs(listing, t as any, language);
  const quickSpecs = getQuickSpecs(listing, t as any);
  const allSpecs = specs.metaData;

  // Card background - subtle, not pitch black
  const cardBg = isDark ? '#131B2E' : '#FFFFFF';
  const rowBg = isDark ? 'rgba(255,255,255,0.04)' : '#F7F9FF';
  const rowBgAlt = isDark ? 'rgba(255,255,255,0.02)' : '#FAFBFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <PageHeader
        title={t('listing.detailsTitle')}
        variant="gradient"
        onBack={handleBack}
        rightSlot={(
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="share-social-outline" size={18} color="#D4AF37" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              disabled={favoriteLoading}
              style={styles.headerIconBtn}
            >
              <View style={styles.headerIconCircle}>
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFavorited ? '#FF4D6D' : '#D4AF37'}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* ════════════ MEDIA GALLERY ════════════ */}
        <View style={styles.heroWrap}>
          <FlatList
            ref={mainListRef}
            data={listing.media}
            renderItem={({ item }) => <ListingMediaItem item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            onScrollToIndexFailed={() => { }}
            scrollEventThrottle={16}
          />
          {/* Bottom gradient for readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.heroGradient}
            pointerEvents="none"
          />
          {/* Price badge overlaid on hero */}
          <View style={styles.heroPriceBadge}>
            <Text style={[styles.heroPriceNum, dirText]}>{Number(listing.price).toLocaleString()}</Text>
            <Text style={[styles.heroPriceCur, dirText]}> {t('common.bhd')}</Text>
          </View>
          {/* Type badge */}
          <View style={[styles.heroTypeBadge, { backgroundColor: accentColor }]}>
            <Text style={[styles.heroTypeTxt, dirText]}>{typeLabel}</Text>
          </View>
          {/* Counter */}
          {listing.media.length > 1 && (
            <View style={styles.heroCnt}>
              <Ionicons name="images-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroCntTxt}>{activeIndex + 1}/{listing.media.length}</Text>
            </View>
          )}
        </View>

        {/* ── Thumbnail Strip ── */}
        {listing.media.length > 1 && (
          <View style={[styles.thumbStrip, { borderBottomColor: borderColor }]}>
            <FlatList
              ref={thumbsListRef}
              data={listing.media}
              renderItem={renderThumbnail}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingVertical: 10 }}
              onScrollToIndexFailed={() => { }}
            />
          </View>
        )}

        {/* ════════════ CONTENT ════════════ */}
        <View style={styles.content}>

          {/* ── Title & Meta row ── */}
          <View style={[styles.titleBlock, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.titleTxt, { color: theme.text }, dirText]}>{listing.title}</Text>
            <View style={[styles.metaRow, rowDirection]}>
              {!!listing.location && (
                <View style={[styles.metaItem, rowDirection]}>
                  <Ionicons name="location-outline" size={13} color={accentColor} />
                  <Text style={[styles.metaTxt, { color: theme.textMuted }, dirText]}>{listing.location}</Text>
                </View>
              )}
              <View style={[styles.metaItem, rowDirection]}>
                <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                <Text style={[styles.metaTxt, { color: theme.textMuted }, dirText]}>
                  {new Date(listing.postedAt).toLocaleDateString(language === 'ar' ? 'ar-BH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Quick Specs Pills ── */}
          {quickSpecs.length > 0 && (
            <View style={[styles.quickBlock, { backgroundColor: cardBg, borderColor }]}>
              <View style={[styles.blockHeader, { borderBottomColor: borderColor }]}>
                <View style={[styles.blockAccent, { backgroundColor: accentColor }]} />
                <Text style={[styles.blockTitle, { color: theme.text }, dirText]}>{t('listing.quickLook')}</Text>
              </View>
              <View style={styles.quickGrid}>
                {quickSpecs.map((item, i) => (
                  <View key={i} style={[styles.quickCell, { borderColor, backgroundColor: rowBg }]}>
                    <View style={[styles.quickIcon, { backgroundColor: accentColor + '20' }]}>
                      <Ionicons name={item.icon as any} size={18} color={accentColor} />
                    </View>
                    <Text style={[styles.quickVal, { color: theme.text }, dirText]} numberOfLines={1}>{item.value}</Text>
                    <Text style={[styles.quickLbl, { color: theme.textMuted }, dirText]}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Full Specs — clean list rows ── */}
          {allSpecs.length > 0 && (
            <View style={[styles.specsBlock, { backgroundColor: cardBg, borderColor }]}>
              <View style={[styles.blockHeader, { borderBottomColor: borderColor }]}>
                <View style={[styles.blockAccent, { backgroundColor: accentColor }]} />
                <Text style={[styles.blockTitle, { color: theme.text }, dirText]}>{t('listing.infoTitle')}</Text>
              </View>
              {allSpecs.map((spec, i) => (
  <View
    key={i}
    style={[
      styles.specRow,
      { backgroundColor: i % 2 === 0 ? rowBg : rowBgAlt, borderBottomColor: borderColor },
      i === allSpecs.length - 1 && styles.specRowLast,
    ]}
  >
    <Text
      style={[styles.specLbl, { color: theme.textMuted }, dirText]}
      numberOfLines={1}
    >
      {spec.label}
    </Text>

    {spec.isLink ? (
      <Text
        style={[styles.specVal, { color: accentColor }, dirText]}
        numberOfLines={2}
        onPress={() =>
          Linking.openURL(`https://maps.google.com/?q=${listing.location}`)
        }
      >
        {spec.value}
      </Text>
    ) : (
      <Text
        style={[styles.specVal, { color: theme.text }, dirText]}
        numberOfLines={2}
      >
        {spec.value}
      </Text>
    )}
  </View>
))}
            </View>
          )}

          {/* ── Description ── */}
          {!!listing.description && (
            <View style={[styles.descBlock, { backgroundColor: cardBg, borderColor }]}>
              <View style={[styles.blockHeader, { borderBottomColor: borderColor }]}>
                <View style={[styles.blockAccent, { backgroundColor: accentColor }]} />
                <Text style={[styles.blockTitle, { color: theme.text }, dirText]}>{t('listing.descriptionTitle')}</Text>
              </View>
              <Text style={[styles.descTxt, { color: theme.textMuted }, dirText]}>{listing.description}</Text>
            </View>
          )}

          {/* ── Seller Card ── */}
          <View style={[styles.sellerBlock, { backgroundColor: cardBg, borderColor }]}>
            <View style={[styles.blockHeader, { borderBottomColor: borderColor }]}>
              <View style={[styles.blockAccent, { backgroundColor: accentColor }]} />
              <Text style={[styles.blockTitle, { color: theme.text }, dirText]}>{t('listing.sellerTitle')}</Text>
            </View>
            <View style={[styles.sellerRow, rowDirection]}>
              <View style={[styles.sellerAvt, { backgroundColor: accentColor + '25' }]}>
                <Text style={[styles.sellerInit, { color: accentColor }]}>
                  {(listing.user.name || t('listing.advertiserFallback')).charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sellerName, { color: theme.text }, dirText]}>{listing.user.name || t('listing.advertiserFallback')}</Text>
                <View style={[styles.verifiedRow, rowDirection]}>
                  <Ionicons name="shield-checkmark" size={13} color="#10B981" />
                  <Text style={[styles.verifiedTxt, dirText]}>{t('listing.trustedMember')}</Text>
                </View>
              </View>
              {listing.user.phone && (
                <TouchableOpacity
                  onPress={handleCall}
                  style={[styles.callPill, rowDirection, { backgroundColor: accentColor + '15', borderColor: accentColor + '50' }]}
                >
                  <Ionicons name="call-outline" size={15} color={accentColor} />
                  <Text style={[styles.callPillTxt, { color: accentColor }, dirText]}>{t('listing.call')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <AdsBanner />
          <View style={{ height: listing?.ownerId && user?.id && listing.ownerId === user.id ? 180 : 130 }} />
        </View>
      </ScrollView>

      {/* ════════════ CTA FOOTER ════════════ */}
      <LinearGradient
        colors={isDark ? ['transparent', theme.background, theme.background] : ['transparent', theme.background, theme.background]}
        style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}
        pointerEvents="box-none"
      >
        <View style={[styles.ctaRow, rowDirection]}>
          {listing?.user?.phone ? (
            <>
              <TouchableOpacity style={[styles.ctaCallBtn, rowDirection, { borderColor }]} onPress={handleCall}>
                <Ionicons name="call" size={19} color={isDark ? '#FFF' : '#0A0B14'} />
                <Text style={[styles.ctaCallTxt, { color: isDark ? '#FFF' : '#0A0B14' }, dirText]}>{t('listing.call')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ctaWABtn, rowDirection]} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={19} color="#FFF" />
                <Text style={[styles.ctaWATxt, dirText]}>{t('listing.whatsapp')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.ctaCallBtn, { flex: 2, borderColor, opacity: 0.5 }]}>
              <Text style={[styles.ctaCallTxt, { color: theme.textMuted }, dirText]}>{t('listing.noPhoneNumber')}</Text>
            </View>
          )}
          {isAuthenticated && listing?.ownerId && user?.id && listing.ownerId !== user.id && (
            <TouchableOpacity
              style={[styles.ctaChatBtn, rowDirection]}
              onPress={handleChat}
              disabled={chatLoading}
            >
              <Ionicons name="chatbubble-ellipses" size={19} color="#ffffff" />
              <Text style={[styles.ctaChatTxt, dirText]}>{t('listing.chat')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Feature button — only for listing owner */}
        {isAuthenticated && listing?.ownerId && user?.id && listing.ownerId === user.id && (
          <TouchableOpacity
            style={[styles.ctaFeatureBtn, rowDirection]}
            onPress={handleOpenFeatureModal}
            activeOpacity={0.85}
          >
            <Ionicons name="star" size={18} color="#0A0B14" />
            <Text style={[styles.ctaFeatureTxt, dirText]}>{t('listing.featureYourListing')}</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* ════════════ FEATURED PACKAGES MODAL ════════════ */}
      <Modal
        visible={showFeatureModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeatureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#111C32' : '#FFFFFF' }]}>
            {/* Handle */}
            <View style={[styles.modalHandle, { backgroundColor: isDark ? '#2A3A5A' : '#CBD5E1' }]} />

            <Text style={[styles.modalTitle, { color: isDark ? '#F0F4FC' : '#0A0B14' }, dirText]}>
              {t('listing.chooseFeaturedPackage')}
            </Text>
            <Text style={[styles.modalSub, { color: isDark ? '#8899BB' : '#64748b' }, dirText]}>
              {t('listing.chooseFeaturedPackageSubtitle')}
            </Text>

            {loadingPackages ? (
              <ActivityIndicator color="#D4AF37" style={{ marginVertical: 32 }} />
            ) : featuredPackages.length === 0 ? (
              <Text style={[styles.modalEmpty, { color: isDark ? '#8899BB' : '#64748b' }, dirText]}>
                {t('listing.noFeaturedPackages')}
              </Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
                {featuredPackages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[styles.pkgCard, { borderColor: isDark ? '#1E2D4A' : '#EEF2FA', backgroundColor: isDark ? '#0F1829' : '#F8FAFF' }]}
                    onPress={() => handleSelectPackage(pkg)}
                    disabled={initiatingFeature}
                    activeOpacity={0.8}
                  >
                    <View style={styles.pkgLeft}>
                      <View style={styles.pkgStarBadge}>
                        <Ionicons name="star" size={20} color="#D4AF37" />
                      </View>
                    </View>
                    <View style={styles.pkgMid}>
                      <Text style={[styles.pkgName, { color: isDark ? '#F0F4FC' : '#0A0B14' }, dirText]}>{language === 'ar' ? (pkg.nameAr || pkg.nameEn || pkg.name || '') : (pkg.nameEn || pkg.nameAr || pkg.name || '')}</Text>
                      <Text style={[styles.pkgDuration, { color: isDark ? '#8899BB' : '#64748b' }, dirText]}>
                        {t('listing.featuredDays', { count: pkg.durationDays })}
                      </Text>
                    </View>
                    <View style={styles.pkgRight}>
                      <Text style={[styles.pkgPrice, dirText]}>{pkg.price.toFixed(3)}</Text>
                      <Text style={[styles.pkgCurrency, { color: isDark ? '#8899BB' : '#64748b' }, dirText]}>{t('common.bhd')}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor: isDark ? '#1E2D4A' : '#EEF2FA' }]}
              onPress={() => setShowFeatureModal(false)}
            >
              <Text style={[styles.modalCancelTxt, { color: isDark ? '#8899BB' : '#64748b' }, dirText]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#ef4444', marginBottom: 20, textAlign: 'right', writingDirection: 'rtl' },
  backButtonSimple: { padding: 10, backgroundColor: '#ef4444', borderRadius: 8 },
  backButtonText: { color: 'white', fontWeight: 'bold' },

  headerActions: { flexDirection: 'row', gap: 10 },
  headerIconBtn: { width: 44, alignItems: 'center', justifyContent: 'center' },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
  },

  // ── Floating Header ──
  floatingHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14,
  },
  hdrBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  hdrRight: { flexDirection: 'row', gap: 8 },

  // ── Hero ──
  heroWrap: { height: ITEM_HEIGHT, backgroundColor: '#000', position: 'relative' },
  mediaContainer: { width, height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  image: { width, height: ITEM_HEIGHT, backgroundColor: '#111' },
  video: { width, height: ITEM_HEIGHT },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  watermarkImage: { width: '28%', height: '28%', opacity: 0.14 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 130 },
  // Price overlay on hero
  heroPriceBadge: {
    position: 'absolute', bottom: 50, right: 16,
    flexDirection: 'row', alignItems: 'flex-end',
  },
  heroPriceNum: {
    color: '#D4AF37', fontSize: 34, fontWeight: '900', letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroPriceCur: {
    color: 'rgba(212,175,55,0.8)', fontSize: 15, fontWeight: '700', marginBottom: 4,
  },
  heroTypeBadge: {
    position: 'absolute', bottom: 18, right: 16,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
  },
  heroTypeTxt: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  heroCnt: {
    position: 'absolute', bottom: 18, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  heroCntTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // ── Thumbnails ──
  thumbStrip: { borderBottomWidth: 1 },
  thumbnailButton: {
    width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 8,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
  },
  thumbnailButtonActive: { borderColor: '#D4AF37' },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbVideoBadge: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Content ──
  content: { paddingTop: 0 },

  // ── Title Block ──
  titleBlock: {
    marginHorizontal: 14, marginTop: 14, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  titleTxt: {
    fontSize: 20, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl',
    lineHeight: 30, marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: 12, fontWeight: '500', textAlign: 'right', writingDirection: 'rtl' },

  // ── Quick Specs Block ──
  quickBlock: {
    marginHorizontal: 14, marginTop: 12, borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  blockHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  blockAccent: { width: 4, height: 18, borderRadius: 2 },
  blockTitle: { fontSize: 15, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingVertical: 14, gap: 10,
  },
  quickCell: {
    width: (width - 28 - 24 - 30) / 4, // 4 per row
    paddingVertical: 12, paddingHorizontal: 4,
    borderRadius: 12, borderWidth: 1,
    alignItems: 'center', gap: 6, minWidth: 70,
  },
  quickIcon: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  quickVal: { fontSize: 12, fontWeight: '800', textAlign: 'center', writingDirection: 'rtl' },
  quickLbl: { fontSize: 10, fontWeight: '500', textAlign: 'center', writingDirection: 'rtl' },

  // ── Specs Block – clean list rows ──
  specsBlock: {
    marginHorizontal: 14, marginTop: 12, borderRadius: 16,
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  specRowLast: { borderBottomWidth: 0 },
  specLbl: { width: 120, fontSize: 13, fontWeight: '500', textAlign: 'right', writingDirection: 'rtl' },
  specVal: { flex: 1, fontSize: 13, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },

  // ── Description Block ──
  descBlock: {
    marginHorizontal: 14, marginTop: 12, borderRadius: 16,
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  descTxt: {
    fontSize: 14, lineHeight: 26, textAlign: 'right', writingDirection: 'rtl',
    paddingHorizontal: 16, paddingBottom: 16,
  },

  // ── Seller Block ──
  sellerBlock: {
    marginHorizontal: 14, marginTop: 12, borderRadius: 16,
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sellerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  sellerAvt: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  sellerInit: { fontSize: 20, fontWeight: '900' },
  sellerName: { fontSize: 16, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl', marginBottom: 3 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedTxt: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  callPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, borderWidth: 1,
  },
  callPillTxt: { fontSize: 13, fontWeight: '700' },

  // ── CTA Footer ──
  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 32, paddingHorizontal: 14,
  },
  ctaRow: { flexDirection: 'row', gap: 10 },
  ctaCallBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5,
  },
  ctaCallTxt: { fontSize: 15, fontWeight: '800' },
  ctaWABtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 15, borderRadius: 16, backgroundColor: '#25D366',
    shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  ctaWATxt: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  ctaChatBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 15, borderRadius: 16, backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  ctaChatTxt: { color: '#0A0B14', fontSize: 15, fontWeight: '800' },

  // ── Feature button ──
  ctaFeatureBtn: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 6,
  },
  ctaFeatureTxt: { color: '#0A0B14', fontSize: 15, fontWeight: '900' },

  // ── Featured Packages Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  modalHandle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  modalSub: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  modalEmpty: { fontSize: 14, textAlign: 'center', marginVertical: 32 },
  pkgCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 10,
  },
  pkgLeft: {},
  pkgStarBadge: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  pkgMid: { flex: 1 },
  pkgName: { fontSize: 15, fontWeight: '800', textAlign: 'right', marginBottom: 4 },
  pkgDuration: { fontSize: 12, fontWeight: '500', textAlign: 'right' },
  pkgRight: { alignItems: 'center' },
  pkgPrice: { fontSize: 20, fontWeight: '900', color: '#D4AF37' },
  pkgCurrency: { fontSize: 11, fontWeight: '600' },
  modalCancelBtn: {
    marginTop: 12, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center',
  },
  modalCancelTxt: { fontSize: 15, fontWeight: '700' },
});

function getQuickSpecs(listing: ListingDetail, t: (key: string) => string): { icon: string; value: string; label: string }[] {
  const q: { icon: string; value: string; label: string }[] = [];
  const v = (x: any) => (x !== null && x !== undefined && x !== '' && x !== '-' ? String(x) : null);

  if (listing.type === 'CAR' && listing.carDetails) {
    const d = Array.isArray(listing.carDetails) ? listing.carDetails[0] : listing.carDetails;
    if (v(d.make)) q.push({ icon: 'car-sport-outline', value: d.make, label: t('listing.specBrand') });
    if (v(d.year)) q.push({ icon: 'calendar-outline', value: String(d.year), label: t('listing.specYear') });
    if (v(d.mileageKm)) q.push({ icon: 'speedometer-outline', value: Number(d.mileageKm).toLocaleString(), label: t('listing.specMileage') });
    if (v(d.transmission)) q.push({ icon: 'git-branch-outline', value: d.transmission === 'MANUAL' ? t('listing.transmissionManual') : t('listing.transmissionAutomatic'), label: t('listing.specTransmission') });
    if (v(d.condition)) q.push({ icon: 'star-outline', value: d.condition === 'NEW' ? t('listing.conditionNew') : t('listing.conditionUsed'), label: t('listing.specCondition') });
  } else if (listing.type === 'MOTORCYCLE' && listing.motorcycleDetails) {
    const d = Array.isArray(listing.motorcycleDetails) ? listing.motorcycleDetails[0] : listing.motorcycleDetails;
    if (v(d.make)) q.push({ icon: 'bicycle-outline', value: d.make, label: t('listing.specBrand') });
    if (v(d.year)) q.push({ icon: 'calendar-outline', value: String(d.year), label: t('listing.specYear') });
    if (v(d.engineSize)) q.push({ icon: 'flash-outline', value: d.engineSize, label: t('listing.specEngine') });
    if (v(d.condition)) q.push({ icon: 'star-outline', value: d.condition === 'NEW' ? t('listing.conditionNew') : t('listing.conditionUsed'), label: t('listing.specCondition') });
  } else if (listing.type === 'PLATE' && listing.plateDetails) {
    const d = Array.isArray(listing.plateDetails) ? listing.plateDetails[0] : listing.plateDetails;
    if (v(d.plateNumber)) q.push({ icon: 'id-card-outline', value: d.plateNumber, label: t('listing.specNumber') });
    if (v(d.plateType)) q.push({ icon: 'car-outline', value: getPlateTypeLabel(d.plateType, t), label: t('listing.specType') });
    if (v(d.plateCategory)) q.push({ icon: 'pricetag-outline', value: getPlateCategoryLabel(d.plateCategory, t), label: t('listing.specCategory') });
  } else if (listing.type === 'PART' && listing.partDetails) {
    const d = Array.isArray(listing.partDetails) ? listing.partDetails[0] : listing.partDetails;
    if (v(d.partName)) q.push({ icon: 'build-outline', value: d.partName, label: t('listing.specPart') });
    if (v(d.brand)) q.push({ icon: 'ribbon-outline', value: d.brand, label: t('listing.specBrand') });
    if (v(d.condition)) q.push({ icon: 'star-outline', value: getListingConditionLabel(d.condition, t), label: t('listing.specCondition') });
  }

  return q;
}

function getCategoryName(listing: ListingDetail, t: (key: string) => string) {
  if (listing.type === 'CAR' || listing.type === 'MOTORCYCLE' || listing.type === 'PART' || listing.type === 'PLATE') return t('listing.categoryVehicles');
  return '-';
}

function getSubCategoryName(listing: ListingDetail, t: (key: string) => string) {
  if (listing.type === 'CAR') return t('listing.subCategoryCars');
  if (listing.type === 'MOTORCYCLE') return t('listing.subCategoryMotorcycles');
  if (listing.type === 'PART') return listing.partDetails?.subCategory || t('listing.subCategoryParts');
  if (listing.type === 'PLATE') return t('listing.subCategoryPlates');
  return '-';
}

function getListingConditionLabel(condition: string | undefined, t: (key: string) => string) {
  if (condition === 'NEW') return t('listing.conditionNew');
  if (condition === 'USED') return t('listing.conditionUsed');
  if (condition === 'REFURBISHED') return t('addListing.conditionRefurbished');
  return condition || '-';
}

function getPlateTypeLabel(plateType: string | undefined, t: (key: string) => string) {
  if (plateType === 'PRIVATE') return t('addListing.platePrivate');
  if (plateType === 'TRANSPORT') return t('addListing.plateTransport');
  if (plateType === 'MOTORCYCLE') return t('addListing.plateMotorcycle');
  return plateType || '-';
}

function getPlateCategoryLabel(category: string | undefined, t: (key: string) => string) {
  switch (category) {
    case 'عادي':
      return t('addListing.plateCategoryRegular');
    case 'مميز':
      return t('addListing.plateCategorySpecial');
    case 'ثنائي':
      return t('addListing.plateCategoryDouble');
    case 'ثلاثي':
      return t('addListing.plateCategoryTriple');
    case 'رباعي':
      return t('addListing.plateCategoryQuad');
    case 'خماسي':
      return t('addListing.plateCategoryFive');
    case 'نقل خفيف':
      return t('addListing.plateCategoryLightTransport');
    case 'نقل ثقيل':
      return t('addListing.plateCategoryHeavyTransport');
    case 'أجرة':
      return t('addListing.plateCategoryTaxi');
    default:
      return category || '-';
  }
}

function getMotorcycleBodyTypeLabel(bodyType: string | undefined, t: (key: string) => string) {
  switch (bodyType) {
    case 'رياضية':
      return t('addListing.motorcycleBodySport');
    case 'سكوتر':
      return t('addListing.motorcycleBodyScooter');
    case 'كروزر':
      return t('addListing.motorcycleBodyCruiser');
    case 'تجوال':
      return t('addListing.motorcycleBodyTouring');
    case 'ديرت بايك':
      return t('addListing.motorcycleBodyDirtBike');
    case 'نيكد':
      return t('addListing.motorcycleBodyNaked');
    case 'أدفنشر':
      return t('addListing.motorcycleBodyAdventure');
    default:
      return bodyType || '-';
  }
}

function getListingSpecs(listing: ListingDetail, t: (key: string) => string, language: string) {
  const metaData: { label: string; value: string; isLink?: boolean }[] = [];
  const mainSpecs: { label: string; value: string; isLink?: boolean }[] = [];

  const val = (v: any) => v || '-';
  const date = listing.postedAt ? new Date(listing.postedAt).toLocaleDateString(language === 'ar' ? 'ar-BH' : 'en-GB') : '-';

  // Left Column (Meta Data) in RTL
  // metaData.push({ label: 'الموقع على الخريطة', value: 'عرض على الخريطة', isLink: true }); // Removed as per request
  metaData.push({ label: t('listing.specDistrict'), value: val(listing.locationArea) });
  metaData.push({ label: t('listing.specCity'), value: val(listing.locationGovernorate) });
  metaData.push({ label: t('listing.specSubCategory'), value: getSubCategoryName(listing, t) });
  metaData.push({ label: t('listing.specSection'), value: getCategoryName(listing, t) });
  metaData.push({ label: t('listing.specAdNumber'), value: val(listing.adNumber) });
  metaData.push({ label: t('listing.specPostedAt'), value: date });

  // Right Column (Main Specs)
  if (listing.type === 'CAR' && listing.carDetails) {
    const d = Array.isArray(listing.carDetails) ? listing.carDetails[0] : listing.carDetails;
    const isNew = d.condition === 'NEW';

    mainSpecs.push({ label: t('listing.specCondition'), value: isNew ? t('listing.conditionNew') : t('listing.conditionUsed') });
    mainSpecs.push({ label: t('listing.specType'), value: val(d.make) });
    mainSpecs.push({ label: t('listing.specModel'), value: val(d.model) });
    mainSpecs.push({ label: t('listing.specClass'), value: val(d.trim) });
    mainSpecs.push({ label: t('listing.specBodyType'), value: val(d.bodyType) });
    if (d.specs?.seats) mainSpecs.push({ label: t('listing.specSeats'), value: val(d.specs.seats) });
    mainSpecs.push({ label: t('listing.specTransmissionType'), value: d.transmission === 'MANUAL' ? t('listing.transmissionManual') : t('listing.transmissionAutomatic') });
    mainSpecs.push({ label: t('listing.specEngineSize'), value: val(d.engineSize) });

    if (!isNew) {
      if (d.color) mainSpecs.push({ label: t('listing.specExteriorColor'), value: val(d.color) });
      if (d.specs?.interiorColor) mainSpecs.push({ label: t('listing.specInteriorColor'), value: val(d.specs.interiorColor) });
      if (d.specs?.bodyCondition) mainSpecs.push({ label: t('listing.specBodyCondition'), value: val(d.specs.bodyCondition) });
      if (d.specs?.paintType || d.specs?.paint) mainSpecs.push({ label: t('listing.specPaint'), value: val(d.specs.paintType || d.specs.paint) });
      mainSpecs.push({ label: t('listing.specPaymentMethod'), value: t('listing.paymentCash') });
    }
  } else if (listing.type === 'MOTORCYCLE' && listing.motorcycleDetails) {
    const d = Array.isArray(listing.motorcycleDetails) ? listing.motorcycleDetails[0] : listing.motorcycleDetails;
    mainSpecs.push({ label: t('listing.specCondition'), value: getListingConditionLabel(d.condition, t) });
    mainSpecs.push({ label: t('listing.specType'), value: val(d.make) });
    mainSpecs.push({ label: t('listing.specCategory'), value: val(d.model) });
    mainSpecs.push({ label: t('listing.specMadeYear'), value: val(d.year) });
    if (d.condition !== 'NEW') mainSpecs.push({ label: t('listing.specKilometers'), value: val(d.mileageKm) });
    mainSpecs.push({ label: t('listing.specEngineSize'), value: val(d.engineSize) || '600 - 749 cc' });
    mainSpecs.push({ label: t('listing.specBodyType'), value: getMotorcycleBodyTypeLabel(d.bodyType, t) });
  } else if (listing.type === 'PART' && listing.partDetails) {
    const d = Array.isArray(listing.partDetails) ? listing.partDetails[0] : listing.partDetails;
    const isNew = d.condition === 'NEW';
    mainSpecs.push({ label: t('listing.specCondition'), value: getListingConditionLabel(d.condition, t) });
    if (isNew) {
      mainSpecs.push({ label: t('listing.specDeliveryService'), value: t('listing.deliveryYes') });
    }
  } else if (listing.type === 'PLATE') {
    // For plates, user image shows no specific specs on right side, mainly meta info
  }

  return { mainSpecs, metaData };
}
