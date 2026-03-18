import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Dimensions, FlatList, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../services/api';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '../../../context/ThemeContext';
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
const ListingMediaItem = React.memo(({ item }: { item: MediaItem }) => {
  if (item.type === 'VIDEO') {
    const player = useVideoPlayer(item.url, player => {
        player.loop = true;
    });

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
    'معلن';

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
  const { id } = useLocalSearchParams();
  const listingId = Array.isArray(id) ? id[0] : id;
  const { user, isAuthenticated } = useAuthStore();
  const { isDark } = useTheme();
  
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
  const insets = useSafeAreaInsets();
  const mainListRef = useRef<FlatList>(null);
  const thumbsListRef = useRef<FlatList>(null);

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
          setError('هذا الإعلان غير متاح (سجّل دخولك لعرض إعلاناتك غير المنشورة)');
        } else if (err?.response?.status === 404) {
          setError('الإعلان غير موجود أو غير متاح');
        } else {
          setError('تعذر تحميل تفاصيل الإعلان');
        }
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const handleBack = () => {
    router.navigate('/' as any);
  };

  const handleShare = async () => {
    try {
      if (listing) {
        await Share.share({
          message: `شاهد هذا الإعلان على KOM: ${listing.title} بسعر ${listing.price} د.ب`,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCall = () => {
    const phone = listing?.user.phone?.toString().trim();
    if (!phone) {
      Alert.alert('تنبيه', 'لا يوجد لهذا المعلن رقم هاتف');
      return;
    }

    const cleaned = phone.replace(/[^\d+]/g, '');
    const telUrl = Platform.OS === 'web' ? `tel:${cleaned}` : `tel:${cleaned}`;
    Linking.openURL(telUrl).catch(() => {
      Alert.alert('خطأ', 'تعذر فتح تطبيق الاتصال');
    });
  };

  const handleWhatsApp = () => {
    const phone = listing?.user.phone?.toString().trim();
    if (!phone) {
      Alert.alert('تنبيه', 'لا يوجد لهذا المعلن رقم هاتف');
      return;
    }

    const cleaned = phone.replace(/[^\d+]/g, '');
    const waUrl = `https://wa.me/${encodeURIComponent(cleaned)}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('خطأ', 'تعذر فتح واتساب');
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
        alert('يجب تسجيل الدخول لإضافة الإعلانات للمفضلة');
      } else {
        alert('حدث خطأ أثناء تحديث المفضلة. حاول مرة أخرى.');
      }
    } finally {
      setFavoriteLoading(false);
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
        <Text style={styles.errorText}>{error || 'الإعلان غير موجود'}</Text>
        <TouchableOpacity style={styles.backButtonSimple} onPress={handleBack}>
           <Text style={styles.backButtonText}>عودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accentColor =
    listing.type === 'CAR' ? '#3B82F6' :
    listing.type === 'MOTORCYCLE' ? '#8B5CF6' :
    listing.type === 'PLATE' ? '#059669' : '#F59E0B';

  const typeLabel =
    listing.type === 'CAR' ? 'سيارة' :
    listing.type === 'MOTORCYCLE' ? 'دراجة نارية' :
    listing.type === 'PLATE' ? 'لوحة' : 'قطعة غيار';

  const specs = getListingSpecs(listing);
  const quickSpecs = getQuickSpecs(listing);
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
        title="تفاصيل الإعلان"
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

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={false}>

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
            onScrollToIndexFailed={() => {}}
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
            <Text style={styles.heroPriceNum}>{Number(listing.price).toLocaleString()}</Text>
            <Text style={styles.heroPriceCur}> د.ب</Text>
          </View>
          {/* Type badge */}
          <View style={[styles.heroTypeBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.heroTypeTxt}>{typeLabel}</Text>
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
              contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}
              ItemSeparatorComponent={() => <View style={styles.thumbSeparator} />}
              onScrollToIndexFailed={() => {}}
            />
          </View>
        )}

        {/* ════════════ CONTENT ════════════ */}
        <View style={styles.content}>

          {/* ── Title & Meta row ── */}
          <View style={[styles.titleBlock, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.titleTxt, { color: theme.text }]}>{listing.title}</Text>
            <View style={styles.metaRow}>
              {!!listing.location && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color={accentColor} />
                  <Text style={[styles.metaTxt, { color: theme.textMuted }]}>{listing.location}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                <Text style={[styles.metaTxt, { color: theme.textMuted }]}>
                  {new Date(listing.postedAt).toLocaleDateString('ar-BH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Quick Specs Pills ── */}
          {quickSpecs.length > 0 && (
            <View style={[styles.quickBlock, { backgroundColor: cardBg, borderColor }]}>
              <View style={[styles.blockHeader, { borderBottomColor: borderColor }]}>
                <View style={[styles.blockAccent, { backgroundColor: accentColor }]} />
                <Text style={[styles.blockTitle, { color: theme.text }]}>نظرة سريعة</Text>
              </View>
              <View style={styles.quickGrid}>
                {quickSpecs.map((item, i) => (
                  <View key={i} style={[styles.quickCell, { borderColor, backgroundColor: rowBg }]}>
                    <View style={[styles.quickIcon, { backgroundColor: accentColor + '20' }]}>
                      <Ionicons name={item.icon as any} size={18} color={accentColor} />
                    </View>
                    <Text style={[styles.quickVal, { color: theme.text }]} numberOfLines={1}>{item.value}</Text>
                    <Text style={[styles.quickLbl, { color: theme.textMuted }]}>{item.label}</Text>
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
                <Text style={[styles.blockTitle, { color: theme.text }]}>معلومات الإعلان</Text>
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
                  <Text style={[styles.specLbl, { color: theme.textMuted }]} numberOfLines={1}>
                    {spec.label}
                  </Text>
                  {spec.isLink ? (
                    <Text
                      style={[styles.specVal, { color: accentColor }]}
                      numberOfLines={2}
                      onPress={() => Linking.openURL(`https://maps.google.com/?q=${listing.location}`)}
                    >
                      {spec.value}
                    </Text>
                  ) : (
                    <Text style={[styles.specVal, { color: theme.text }]} numberOfLines={2}>
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
                <Text style={[styles.blockTitle, { color: theme.text }]}>الوصف</Text>
              </View>
              <Text style={[styles.descTxt, { color: theme.textMuted }]}>{listing.description}</Text>
            </View>
          )}

          {/* ── Seller Card ── */}
          <View style={[styles.sellerBlock, { backgroundColor: cardBg, borderColor }]}>
            <View style={[styles.blockHeader, { borderBottomColor: borderColor }]}>
              <View style={[styles.blockAccent, { backgroundColor: accentColor }]} />
              <Text style={[styles.blockTitle, { color: theme.text }]}>المعلن</Text>
            </View>
            <View style={styles.sellerRow}>
              <View style={[styles.sellerAvt, { backgroundColor: accentColor + '25' }]}>
                <Text style={[styles.sellerInit, { color: accentColor }]}>
                  {listing.user.name.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sellerName, { color: theme.text }]}>{listing.user.name}</Text>
                <View style={styles.verifiedRow}>
                  <Ionicons name="shield-checkmark" size={13} color="#10B981" />
                  <Text style={styles.verifiedTxt}>عضو موثوق</Text>
                </View>
              </View>
              {listing.user.phone && (
                <TouchableOpacity
                  onPress={handleCall}
                  style={[styles.callPill, { backgroundColor: accentColor + '15', borderColor: accentColor + '50' }]}
                >
                  <Ionicons name="call-outline" size={15} color={accentColor} />
                  <Text style={[styles.callPillTxt, { color: accentColor }]}>اتصال</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ height: 130 }} />
        </View>
      </ScrollView>

      {/* ════════════ CTA FOOTER ════════════ */}
      <LinearGradient
        colors={isDark ? ['transparent', theme.background, theme.background] : ['transparent', theme.background, theme.background]}
        style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}
        pointerEvents="box-none"
      >
        <View style={styles.ctaRow}>
          {listing?.user?.phone ? (
            <>
              <TouchableOpacity style={[styles.ctaCallBtn, { borderColor }]} onPress={handleCall}>
                <Ionicons name="call" size={19} color={isDark ? '#FFF' : '#0A0B14'} />
                <Text style={[styles.ctaCallTxt, { color: isDark ? '#FFF' : '#0A0B14' }]}>اتصال</Text>
              </TouchableOpacity>
              <View style={styles.ctaSpacer} />
              <TouchableOpacity style={styles.ctaWABtn} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={19} color="#FFF" />
                <Text style={styles.ctaWATxt}>واتساب</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.ctaCallBtn, { flex: 2, borderColor, opacity: 0.5 }]}>
              <Text style={[styles.ctaCallTxt, { color: theme.textMuted }]}>لا يوجد رقم هاتف</Text>
            </View>
          )}
          {isAuthenticated && listing?.ownerId && user?.id && listing.ownerId !== user.id && (
            <>
              <View style={styles.ctaSpacer} />
              <TouchableOpacity
                style={styles.ctaChatBtn}
                onPress={handleChat}
                disabled={chatLoading}
              >
                <Ionicons name="chatbubble-ellipses" size={19} color="#ffffff" />
                <Text style={styles.ctaChatTxt}>محادثة</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#ef4444', marginBottom: 20, textAlign: 'right' },
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
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14,
  },
  hdrBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  hdrRight: { flexDirection: 'row' },
  hdrBtnSpacer: { marginLeft: 8 },

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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  heroCntTxt: { color: '#FFF', fontSize: 12, fontWeight: '700', marginLeft: 5 },

  // ── Thumbnails ──
  thumbStrip: { borderBottomWidth: 1 },
  thumbSeparator: { width: 8 },
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
  metaRow: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', marginLeft: 12, marginBottom: 8 },
  metaTxt: { fontSize: 12, fontWeight: '500', marginRight: 4, flexShrink: 1, textAlign: 'right', writingDirection: 'rtl' },

  // ── Quick Specs Block ──
  quickBlock: {
    marginHorizontal: 14, marginTop: 12, borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  blockHeader: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  blockAccent: { width: 4, height: 18, borderRadius: 2 },
  blockTitle: { fontSize: 15, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl', marginRight: 10 },
  quickGrid: {
    flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 14,
  },
  quickCell: {
    width: '24%',
    paddingVertical: 12, paddingHorizontal: 4,
    borderRadius: 12, borderWidth: 1,
    alignItems: 'center', minWidth: 70, marginBottom: 10,
  },
  quickIcon: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  quickVal: { fontSize: 12, fontWeight: '800', textAlign: 'center', writingDirection: 'rtl', marginTop: 6 },
  quickLbl: { fontSize: 10, fontWeight: '500', textAlign: 'center', writingDirection: 'rtl', marginTop: 2 },

  // ── Specs Block – clean list rows ──
  specsBlock: {
    marginHorizontal: 14, marginTop: 12, borderRadius: 16,
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  specRow: {
    flexDirection: 'row-reverse', justifyContent: 'flex-start', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  specRowLast: { borderBottomWidth: 0 },
  specLbl: {
    width: 120,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginLeft: 12,
    flexShrink: 0,
  },
  specVal: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    flexShrink: 1,
  },

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
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  sellerAvt: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 12,
  },
  sellerInit: { fontSize: 20, fontWeight: '900' },
  sellerName: { fontSize: 16, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl', marginBottom: 3 },
  verifiedRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  verifiedTxt: { fontSize: 12, color: '#10B981', fontWeight: '600', marginRight: 4 },
  callPill: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, borderWidth: 1,
    marginRight: 12,
  },
  callPillTxt: { fontSize: 13, fontWeight: '700', marginRight: 6 },

  // ── CTA Footer ──
  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 32, paddingHorizontal: 14,
  },
  ctaRow: { flexDirection: 'row-reverse', alignItems: 'stretch' },
  ctaSpacer: { width: 10 },
  ctaCallBtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 16, borderWidth: 1.5,
  },
  ctaCallTxt: { fontSize: 15, fontWeight: '800' },
  ctaWABtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 16, backgroundColor: '#25D366',
    shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  ctaWATxt: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  ctaChatBtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 16, backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  ctaChatTxt: { color: '#0A0B14', fontSize: 15, fontWeight: '800' },
});

function getQuickSpecs(listing: ListingDetail): { icon: string; value: string; label: string }[] {
  const q: { icon: string; value: string; label: string }[] = [];
  const v = (x: any) => (x !== null && x !== undefined && x !== '' && x !== '-' ? String(x) : null);

  if (listing.type === 'CAR' && listing.carDetails) {
    const d = Array.isArray(listing.carDetails) ? listing.carDetails[0] : listing.carDetails;
    if (v(d.make)) q.push({ icon: 'car-sport-outline', value: d.make, label: 'الماركة' });
    if (v(d.year)) q.push({ icon: 'calendar-outline', value: String(d.year), label: 'السنة' });
    if (v(d.mileageKm)) q.push({ icon: 'speedometer-outline', value: Number(d.mileageKm).toLocaleString(), label: 'الكيلو' });
    if (v(d.transmission)) q.push({ icon: 'git-branch-outline', value: d.transmission === 'MANUAL' ? 'عادي' : 'أوتو', label: 'الناقل' });
    if (v(d.condition)) q.push({ icon: 'star-outline', value: d.condition === 'NEW' ? 'جديد' : 'مستعمل', label: 'الحالة' });
  } else if (listing.type === 'MOTORCYCLE' && listing.motorcycleDetails) {
    const d = Array.isArray(listing.motorcycleDetails) ? listing.motorcycleDetails[0] : listing.motorcycleDetails;
    if (v(d.make)) q.push({ icon: 'bicycle-outline', value: d.make, label: 'الماركة' });
    if (v(d.year)) q.push({ icon: 'calendar-outline', value: String(d.year), label: 'السنة' });
    if (v(d.engineSize)) q.push({ icon: 'flash-outline', value: d.engineSize, label: 'المحرك' });
    if (v(d.condition)) q.push({ icon: 'star-outline', value: d.condition === 'NEW' ? 'جديد' : 'مستعمل', label: 'الحالة' });
  } else if (listing.type === 'PLATE' && listing.plateDetails) {
    const d = Array.isArray(listing.plateDetails) ? listing.plateDetails[0] : listing.plateDetails;
    if (v(d.plateNumber)) q.push({ icon: 'id-card-outline', value: d.plateNumber, label: 'الرقم' });
    if (v(d.plateType)) q.push({ icon: 'car-outline', value: d.plateType, label: 'النوع' });
    if (v(d.plateCategory)) q.push({ icon: 'pricetag-outline', value: d.plateCategory, label: 'الفئة' });
  } else if (listing.type === 'PART' && listing.partDetails) {
    const d = Array.isArray(listing.partDetails) ? listing.partDetails[0] : listing.partDetails;
    if (v(d.partName)) q.push({ icon: 'build-outline', value: d.partName, label: 'القطعة' });
    if (v(d.brand)) q.push({ icon: 'ribbon-outline', value: d.brand, label: 'الماركة' });
    if (v(d.condition)) q.push({ icon: 'star-outline', value: d.condition === 'NEW' ? 'جديد' : 'مستعمل', label: 'الحالة' });
  }

  return q;
}

function getCategoryName(listing: ListingDetail) {
    if (listing.type === 'CAR' || listing.type === 'MOTORCYCLE' || listing.type === 'PART' || listing.type === 'PLATE') return 'سيارات ومركبات';
    return '-';
}

function getSubCategoryName(listing: ListingDetail) {
    if (listing.type === 'CAR') return 'سيارات للبيع';
    if (listing.type === 'MOTORCYCLE') return 'دراجات نارية';
    if (listing.type === 'PART') return listing.partDetails?.subCategory || 'قطع غيار';
    if (listing.type === 'PLATE') return 'أرقام لوحات مركبات';
    return '-';
}

function getListingSpecs(listing: ListingDetail) {
  const metaData: { label: string; value: string; isLink?: boolean }[] = [];
  const mainSpecs: { label: string; value: string; isLink?: boolean }[] = [];
  
  const val = (v: any) => v || '-';
  const date = listing.postedAt ? new Date(listing.postedAt).toLocaleDateString('en-GB') : '-';
  
  // Left Column (Meta Data) in RTL
  // metaData.push({ label: 'الموقع على الخريطة', value: 'عرض على الخريطة', isLink: true }); // Removed as per request
  metaData.push({ label: 'الحي', value: val(listing.locationArea) });
  metaData.push({ label: 'المدينة', value: val(listing.locationGovernorate) });
  metaData.push({ label: 'القسم الفرعي', value: getSubCategoryName(listing) });
  metaData.push({ label: 'القسم', value: getCategoryName(listing) });
  metaData.push({ label: 'إعلان رقم', value: val(listing.adNumber) });
  metaData.push({ label: 'تاريخ النشر', value: date });

  // Right Column (Main Specs)
    if (listing.type === 'CAR' && listing.carDetails) {
      const d = Array.isArray(listing.carDetails) ? listing.carDetails[0] : listing.carDetails;
     const isNew = d.condition === 'NEW';
     
     mainSpecs.push({ label: 'الحالة', value: isNew ? 'جديد' : 'مستعمل' });
     mainSpecs.push({ label: 'النوع', value: val(d.make) });
     mainSpecs.push({ label: 'موديل', value: val(d.model) });
     mainSpecs.push({ label: 'الفئة', value: val(d.trim) });
     mainSpecs.push({ label: 'نوع الهيكل', value: val(d.bodyType) });
     if (d.specs?.seats) mainSpecs.push({ label: 'عدد المقاعد', value: val(d.specs.seats) });
     mainSpecs.push({ label: 'نوع ناقل الحركة', value: d.transmission === 'MANUAL' ? 'عادي' : 'اوتوماتيك' });
     mainSpecs.push({ label: 'سعة المحرك', value: val(d.engineSize) });
     
     if (!isNew) {
         if (d.color) mainSpecs.push({ label: 'اللون الخارجي', value: val(d.color) });
         if (d.specs?.interiorColor) mainSpecs.push({ label: 'اللون الداخلي', value: val(d.specs.interiorColor) });
         if (d.specs?.bodyCondition) mainSpecs.push({ label: 'حالة الهيكل', value: val(d.specs.bodyCondition) });
         if (d.specs?.paintType || d.specs?.paint) mainSpecs.push({ label: 'الدهان', value: val(d.specs.paintType || d.specs.paint) });
         mainSpecs.push({ label: 'طريقة الدفع', value: 'كاش' }); 
     }
    } else if (listing.type === 'MOTORCYCLE' && listing.motorcycleDetails) {
      const d = Array.isArray(listing.motorcycleDetails) ? listing.motorcycleDetails[0] : listing.motorcycleDetails;
      mainSpecs.push({ label: 'الحالة', value: d.condition === 'NEW' ? 'جديد' : 'مستعمل' });
      mainSpecs.push({ label: 'النوع', value: val(d.make) });
      mainSpecs.push({ label: 'الفئة', value: val(d.model) });
      mainSpecs.push({ label: 'سنة الصنع', value: val(d.year) });
      if (d.condition !== 'NEW') mainSpecs.push({ label: 'الكيلومترات', value: val(d.mileageKm) });
      mainSpecs.push({ label: 'سعة المحرك', value: val(d.engineSize) || '600 - 749 سي سي' }); 
      mainSpecs.push({ label: 'نوع الهيكل', value: 'رياضية' });
    } else if (listing.type === 'PART' && listing.partDetails) {
      const d = Array.isArray(listing.partDetails) ? listing.partDetails[0] : listing.partDetails;
      const isNew = d.condition === 'NEW';
      mainSpecs.push({ label: 'الحالة', value: isNew ? 'جديد' : 'مستعمل' });
      if (isNew) {
          mainSpecs.push({ label: 'هل لديك خدمة توصيل؟', value: 'نعم' });
      }
  } else if (listing.type === 'PLATE') {
     // For plates, user image shows no specific specs on right side, mainly meta info
  }

  return { mainSpecs, metaData };
}
