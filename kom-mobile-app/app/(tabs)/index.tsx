import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  I18nManager,
  ScrollView,
  Modal,
  ImageBackground,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { CarBrands, MotorcycleBrands } from '@/constants/CarData';
import StoriesRail, { StoryUser } from '@/components/stories/StoriesRail';
import AddStoryModal from '@/components/stories/AddStoryModal';
import StoryViewer from '@/components/stories/StoryViewer';
import AdsBanner from '@/components/ads/AdsBanner';
import SubscriptionPromoCard from '@/components/ads/SubscriptionPromoCard';
import LuckWinnerBanner from '@/components/luck/LuckWinnerBanner';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

type FilterType = 'ALL' | 'CAR' | 'PLATE' | 'PART' | 'MOTORCYCLE';

type SafeModelItem = {
  key: string;
  label: string;
  valueEn: string;
  valueAr: string;
};

// ============================================
// UTILITY: Convert any value to a safe string
// ============================================
function safeString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.ar === 'string') return obj.ar;
    if (typeof obj.en === 'string') return obj.en;
    return fallback;
  }
  return fallback;
}

// ============================================
// UTILITY: Generate safe unique keys for FlatList
// ============================================
function getKey(value: unknown, index: number, prefix: string = 'item'): string {
  const str = safeString(value);
  if (str) {
    return `${prefix}-${str}-${index}`;
  }
  return `${prefix}-${index}`;
}

// ============================================
// BUILD MODEL ITEMS
// ============================================
function buildSafeModelItems(brand: { models?: unknown[] } | null | undefined): SafeModelItem[] {
  const result: SafeModelItem[] = [];
  result.push({
    key: 'safe-model-all',
    label: 'الكل',
    valueEn: '__ALL__',
    valueAr: '__ALL__',
  });
  
  const rawModels = Array.isArray(brand?.models) ? brand.models : [];
  
  for (let i = 0; i < rawModels.length; i++) {
    const model = rawModels[i];
    let labelStr: string;
    let enStr: string;
    let arStr: string;
    
    if (typeof model === 'string') {
      labelStr = model;
      enStr = model;
      arStr = model;
    } else if (model && typeof model === 'object') {
      const modelObj = model as Record<string, unknown>;
      enStr = typeof modelObj.en === 'string' ? modelObj.en : '';
      arStr = typeof modelObj.ar === 'string' ? modelObj.ar : '';
      labelStr = arStr || enStr || `موديل ${i + 1}`;
      if (!enStr) enStr = arStr || `model_${i}`;
      if (!arStr) arStr = enStr;
    } else {
      labelStr = `موديل ${i + 1}`;
      enStr = `unknown_model_${i}`;
      arStr = labelStr;
    }
    
    result.push({
      key: `safe-model-${i}-${enStr.replace(/\s+/g, '_')}`,
      label: labelStr,
      valueEn: enStr,
      valueAr: arStr,
    });
  }
  
  result.push({
    key: 'safe-model-other',
    label: 'أخرى',
    valueEn: '__OTHER__',
    valueAr: '__OTHER__',
  });
  
  return result;
}

const filterOptions: { label: string; value: FilterType; image: any }[] = [
  { label: 'الكل', value: 'ALL', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=150&q=80' },
  { label: 'سيارات', value: 'CAR', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=150&q=80' },
  { label: 'دراجات', value: 'MOTORCYCLE', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=150&q=80' },
  { label: 'لوحات', value: 'PLATE', image: require('@/assets/images/plate-placeholder.png') },
  { label: 'قطع غيار', value: 'PART', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=150&q=80' },
];

function formatTimeAgo(dateString: string | undefined | null) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'الآن';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `قبل ${diffInMinutes} ${diffInMinutes === 1 ? 'دقيقة' : diffInMinutes === 2 ? 'دقيقتين' : (diffInMinutes >= 3 && diffInMinutes <= 10) ? 'دقائق' : 'دقيقة'}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `قبل ${diffInHours} ${diffInHours === 1 ? 'ساعة' : diffInHours === 2 ? 'ساعتين' : (diffInHours >= 3 && diffInHours <= 10) ? 'ساعات' : 'ساعة'}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `قبل ${diffInDays} ${diffInDays === 1 ? 'يوم' : diffInDays === 2 ? 'يومين' : (diffInDays >= 3 && diffInDays <= 10) ? 'أيام' : 'يوم'}`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `قبل ${diffInWeeks} ${diffInWeeks === 1 ? 'أسبوع' : diffInWeeks === 2 ? 'أسبوعين' : (diffInWeeks >= 3 && diffInWeeks <= 10) ? 'أسابيع' : 'أسبوع'}`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `قبل ${diffInMonths} ${diffInMonths === 1 ? 'شهر' : diffInMonths === 2 ? 'شهرين' : (diffInMonths >= 3 && diffInMonths <= 10) ? 'أشهر' : 'شهر'}`;

  return date.toLocaleDateString('ar-EG');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  logo: {
    width: 110,
    height: 38,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 18,
    borderWidth: 1.5,
  },
  searchPlaceholder: {
    flex: 1,
    textAlign: 'right',
    marginEnd: 10,
    fontSize: 14,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  filterContainer: {
    paddingVertical: 16,
    paddingStart: 12, // Maintain padding
  },
  filterScroll: {
    paddingEnd: 16,
    gap: 12,
  },
  categoryCard: {
    width: 85,
    height: 85,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardActive: {
    borderColor: '#D4AF37', // Gold border for active
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  categoryText: {
    fontSize: 12,
    zIndex: 2,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
// Force Right Alignment for everything in this header
  sectionHeader: {
    paddingLeft: 16,
    paddingRight: 0, // Zero right padding - titles stick to the edge
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
  },
  listContainer: {
    paddingBottom: 160,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  // NEW LUXURY CARD STYLES
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 6px 24px rgba(26,32,80,0.12)' },
      default: {
        shadowColor: '#1A2050',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 6,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EEF2FA',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 12,
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  priceText: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  cardContent: {
    padding: 11,
    paddingLeft: 14,
    alignItems: 'flex-end',
    width: '100%',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
    width: '100%',
  },
  separator: {
    height: 1,
    backgroundColor: '#EEF2FA',
    marginVertical: 5,
    width: '100%',
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // Modal Styles remain mostly same
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
  },  
  closeButton: {
    padding: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  brandGrid: {
    paddingBottom: 30,
  },
  brandItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    padding: 10,
    borderWidth: 1,
    borderRadius: 16,
    aspectRatio: 1,
  },
  brandLogoContainer: {
    width: 44,
    height: 44,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', 
    borderRadius: 8,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    textAlign: 'right',
  },
  modelList: {
    paddingBottom: 30,
  },
  modelItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  modelName: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageCountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 3,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  watermark: {
     width: width * 0.8,
     height: width * 0.8,
     position: 'absolute',
     top: height / 2 - (width * 0.4),
     left: width / 2 - (width * 0.4),
     opacity: 0.03, // Very subtle opacity
     transform: [{ rotate: '-15deg' }]
  }
});

const FilterHeader = React.memo(({ selectedFilter, onSelect, theme }: { selectedFilter: any, onSelect: any, theme: any }) => {
  const scrollRef = useRef<any>(null);



  return (
    <View style={[styles.filterContainer, { backgroundColor: theme.surface }]}>
        <ScrollView 
          ref={scrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterScroll,
            { flexDirection: 'row-reverse' },
          ]}
        >
          {filterOptions.map((option) => {
            const isActive = selectedFilter === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.categoryCard, isActive && styles.categoryCardActive]}
                onPress={() => onSelect(option.value)}
                activeOpacity={0.8}
              >
                <Image
                  source={typeof option.image === 'string' ? { uri: option.image } : option.image}
                  style={styles.categoryImage}
                  contentFit="cover"
                />
                <View style={[styles.categoryOverlay, isActive && { backgroundColor: 'rgba(212, 175, 55, 0.4)' }]} />
                
                <Text style={styles.categoryText}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
  );
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Query key — changes trigger a new fetch (React Query caches by key)
  const [queryFilter, setQueryFilter] = useState<FilterType>('ALL');
  const [queryParams, setQueryParams] = useState<Record<string, any>>({});

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
  // Store previous filter to revert on cancel
  const [previousFilter, setPreviousFilter] = useState<FilterType>('ALL');
  const [activeParams, setActiveParams] = useState<any>({});
  
  // Filter Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStep, setFilterStep] = useState<'BRAND' | 'MODEL' | 'MOTO_BRAND' | 'PLATE_TYPE'>('BRAND');
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [selectedMotoBrand, setSelectedMotoBrand] = useState<any>(null);
  
  // Stories State
  const [addStoryVisible, setAddStoryVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStories, setViewerStories] = useState<StoryUser[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [viewerInitialUserId, setViewerInitialUserId] = useState<string | undefined>(undefined);
  const [storiesRefreshTrigger, setStoriesRefreshTrigger] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [luckWinner, setLuckWinner] = useState<{ code: string; userName: string; drawnAt: string } | null>(null);

  const { isDark } = useTheme();
  const { isAuthenticated } = useAuthStore();

  // ─── React Query: cached listings fetch ──────────────────────────────────
  const { data: listings = [], isLoading: loading, refetch } = useQuery<any[]>({
    queryKey: ['listings', queryFilter, queryParams],
    queryFn: async () => {
      const params: any = { status: 'APPROVED', limit: 30, ...queryParams };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') delete params[k];
      });
      if (queryFilter !== 'ALL') params.type = queryFilter;
      const response = await api.get('/listings', { params });
      const payload = response.data?.data ?? response.data;
      return Array.isArray(payload) ? payload : (payload?.items ?? []);
    },
  });

  // filteredListings = listings (server already filters by type/params)
  const filteredListings = listings;

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        api
          .get('/notifications/unread-count')
          .then((res) => {
            const count = res.data?.unreadCount ?? res.data?.data?.unreadCount ?? 0;
            setUnreadCount(count);
          })
          .catch((err) => console.log('Error fetching notification count:', err));
      } else {
        setUnreadCount(0);
      }
    }, [isAuthenticated])
  );

  // Fetch luck winner for banner
  useEffect(() => {
    api.get('/luck/status')
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data?.winner) setLuckWinner(data.winner);
      })
      .catch(() => {});
  }, []);

  const sectionData = React.useMemo(() => {
    const data: any[] = [];

    if (selectedFilter === 'ALL') {
      // أحدث العروض — المميزة فقط، إذا لم توجد لا يظهر القسم
      const featured = listings.filter((l: any) => l.isFeatured === true).slice(0, 10);
      if (featured.length > 0) {
        data.push({ type: 'CATEGORY_SECTION', id: 'sec_latest', title: '⭐ أحدث العروض المميزة', filterType: null, items: featured });
      }
      // قسم لكل فئة
      const categories = [
        { key: 'CAR',        title: 'سيارات',     filterType: 'CAR'        as FilterType },
        { key: 'MOTORCYCLE', title: 'دراجات',     filterType: 'MOTORCYCLE' as FilterType },
        { key: 'PLATE',      title: 'لوحات',      filterType: 'PLATE'      as FilterType },
        { key: 'PART',       title: 'قطع غيار',   filterType: 'PART'       as FilterType },
      ];
      for (const cat of categories) {
        const items = listings.filter((l: any) => l.type === cat.key).slice(0, 10);
        if (items.length > 0) {
          data.push({ type: 'CATEGORY_SECTION', id: `sec_${cat.key}`, title: cat.title, filterType: cat.filterType, items });
        }
      }
      // بنر إعلاني واحد في النهاية
      data.push({ type: 'AD_BANNER', id: 'ad_banner_end' });
    } else {
      // شبكة عادية للفئة المحددة
      data.push({ type: 'HEADER_TITLE', id: 'section_header_title' });
      let adCount = 0;
      for (let i = 0; i < filteredListings.length; i += 2) {
        const rowIndex = i / 2;
        if (rowIndex > 0 && rowIndex % 5 === 0 && adCount < 3) {
          data.push({ type: 'AD_BANNER', id: `ad_banner_${rowIndex}` });
          adCount++;
        }
        data.push({
          type: 'ROW',
          id: `row_${i}`,
          items: filteredListings.slice(i, i + 6)
        });
      }
    }

    return [{ data }];
  }, [filteredListings, listings, selectedFilter]);

  const theme = {
    background: isDark ? '#0A0B14' : '#F2F5FC',
    surface: isDark ? '#111C32' : '#FFFFFF',
    border: isDark ? '#1E2D4A' : '#EEF2FA',
    text: isDark ? '#F0F4FC' : '#0A0B14',
    subText: isDark ? '#8899BB' : '#475569',
    muted: isDark ? '#4A5568' : '#9BA3B2',
    primary: Colors.primary,
  };

  const fetchListings = (typeOverride?: FilterType, extraParams: any = null) => {
    const type = typeOverride !== undefined ? typeOverride : selectedFilter;

    let newParams: Record<string, any> = {};
    if (extraParams) {
      // Remove empty values
      Object.keys(extraParams).forEach((k) => {
        if (extraParams[k] !== undefined && extraParams[k] !== null && extraParams[k] !== '') {
          newParams[k] = extraParams[k];
        }
      });
      setActiveParams(newParams);
    } else if (typeOverride) {
      setActiveParams({});
    }

    setQueryFilter(type);
    setQueryParams(newParams);
  };

  const toText = safeString;
  const getLocalizedText = safeString;
  const getListingTitle = (item: any) => safeString(item?.title, '');
  const getListingCity = (item: any) => safeString(item?.city, 'البحرين');

  const handleFilterChange = (filter: FilterType) => {
    // Save current as previous before switching in case of cancel
    setPreviousFilter(selectedFilter);
    setSelectedFilter(filter);
    
    // IF selecting a complex type, don't fetch yet - just open modal
    if (filter === 'CAR') {
      setFilterStep('BRAND');
      setModalVisible(true);
      return; 
    } else if (filter === 'MOTORCYCLE') {
      setFilterStep('MOTO_BRAND');
      setModalVisible(true);
      return;
    } else if (filter === 'PLATE') {
      setFilterStep('PLATE_TYPE');
      setModalVisible(true);
      return;
    }

    // For simple filters (ALL/PART), fetch immediately
    fetchListings(filter);
  };

  const closeModal = () => {
    setModalVisible(false);
    
    // If we have PARTIAL selection (e.g. brand selected but model cancelled), process it
    if ((selectedFilter === 'CAR' || selectedFilter === 'MOTORCYCLE') && selectedBrand) {
       const makeName = selectedBrand.nameAr || selectedBrand.name;
       fetchListings(selectedFilter, { make: makeName });
    } 
    // If we have selected a PLATE type but not fully committed via handlePlateTypeSelect...
    // Actually handlePlateTypeSelect closes the modal itself. 
    // So if we are here, we likely cancelled the plate type selection.
    
    // If we have NO selection (just opened modal and closed immediately), revert to previous filter
    else if (!selectedBrand && !selectedMotoBrand) {
        setSelectedFilter(previousFilter);
        // Do NOT fetch. Just revert UI state.
    }
    
    setSelectedBrand(null);
    setSelectedMotoBrand(null);
    setFilterStep('BRAND');
  };

  const handleBrandSelect = (brand: any) => {
    if (brand.id === 'all') {
      fetchListings('CAR', { make: undefined, model: undefined });
      closeModal();
      return;
    }
    
    setSelectedBrand(brand);
    // Don't fetch here, just move to next step
    setFilterStep('MODEL');
  };

  const handleMotoBrandSelect = (brand: any) => {
    if (brand.id === 'all') {
       fetchListings('MOTORCYCLE', { make: undefined, model: undefined });
       setModalVisible(false); // Directly close
       return;
    }
    
    setSelectedMotoBrand(brand);
    // For motorcycles, we don't have models yet, so fetch directly
    const makeName = brand.nameAr || brand.name;
    fetchListings('MOTORCYCLE', { make: makeName, model: undefined });
    setModalVisible(false); // Directly close
  };

  const handlePlateTypeSelect = (plateType: string) => {
    if (plateType === 'ALL') {
       fetchListings('PLATE', { plateType: undefined });
    } else {
       fetchListings('PLATE', { plateType: plateType });
    }
    setModalVisible(false); // Directly close
  };

  const handleModelSelect = (modelItem: SafeModelItem) => {
    const modelEn = modelItem.valueEn;
    const modelAr = modelItem.valueAr;
    setModalVisible(false); // Close first
    
    // NOW fetch
    const brandName = selectedBrand?.nameAr || selectedBrand?.name;
    if (modelEn === '__ALL__' || modelEn === '__OTHER__') {
      fetchListings(selectedFilter, { make: brandName, model: undefined }); // Use current context filter
    } else {
      fetchListings(selectedFilter, { make: brandName, model: modelAr }); // Use current context filter
    }
    
    // Reset state after selection
    setSelectedBrand(null);
    setFilterStep('BRAND');
  };

  const onRefresh = () => {
    setRefreshing(true);
    setStoriesRefreshTrigger(prev => prev + 1);
    refetch().finally(() => setRefreshing(false));
  };

  const handleAddStory = () => setAddStoryVisible(true);

  const handleStoryPress = (index: number, stories: StoryUser[], userId?: string) => {
    setViewerStories(stories);
    setViewerInitialIndex(index);
    setViewerInitialUserId(userId);
    setViewerVisible(true);
  };

  const handleStorySuccess = () => {
    setAddStoryVisible(false);
    setStoriesRefreshTrigger(prev => prev + 1);
  };

  const getImageUris = (item: any): string[] => {
    const media = item?.media;
    if (Array.isArray(media) && media.length > 0) {
      // Filter to IMAGE type only — video URLs cannot be rendered by expo-image
      const imageMedia = media.filter((m: any) => m?.type === 'IMAGE' || m?.type === 'image');
      if (imageMedia.length > 0) {
        return imageMedia.map((m: any) => m?.url).filter(Boolean) as string[];
      }
      // Fallback: if no media has a type field, return all that have urls
      return media.map((m: any) => m?.url).filter(Boolean) as string[];
    }
    const images = item?.images;
    if (Array.isArray(images) && images.length > 0) {
      return images.map((img: any) => {
        if (typeof img === 'string') return img;
        if (img?.url) return img.url;
        return null;
      }).filter(Boolean) as string[];
    }
    return [];
  };

  const getImageUri = (item: any) => {
    const uris = getImageUris(item);
    return uris.length > 0 ? uris[0] : null;
  };

  // ============================================
  // NEW LUXURY CARD DESIGN
  // ============================================
  const renderListingCard = ({ item }: { item: any }) => {
    const imageUris = getImageUris(item);
    const imageUri = imageUris.length > 0 ? imageUris[0] : null;
    const typeAccent =
      item.type === 'MOTORCYCLE' ? '#8B5CF6' :
      item.type === 'PLATE'      ? '#059669' :
      item.type === 'PART'       ? '#F59E0B' :
      '#3B82F6';
    const typeLabel =
      item.type === 'PLATE' ? 'لوحة' :
      item.type === 'MOTORCYCLE' ? 'دراجة' :
      item.type === 'PART' ? 'قطعة' : 'سيارة';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface }]}
        onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id, backLink: '/(tabs)/index' } })}
        activeOpacity={0.88}
      >
        {/* Colored top accent bar */}
        <View style={{ height: 3, backgroundColor: typeAccent }} />

        <View style={styles.imageContainer}>
          {imageUris.length > 1 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              scrollEventThrottle={16}
              nestedScrollEnabled={true}
              style={{ width: CARD_WIDTH, height: 160 }}
            >
              {imageUris.map((uri: string, idx: number) => (
                <Image
                  key={idx}
                  source={{ uri }}
                  style={[styles.cardImage, { width: CARD_WIDTH }]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
              ))}
            </ScrollView>
          ) : imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.cardImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <View style={[styles.cardImage, styles.noImage, { backgroundColor: typeAccent + '18' }]}>
              <Ionicons name="car-outline" size={36} color={typeAccent} />
            </View>
          )}
          {/* Image count badge */}
          {imageUris.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Ionicons name="images-outline" size={10} color="#FFF" />
              <Text style={styles.imageCountText}>{imageUris.length}</Text>
            </View>
          )}
          {/* Price overlay — bottom fade */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.72)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.priceOverlay}
          >
            <Text style={styles.priceText}>
              {toText(
                typeof item.price === 'number'
                  ? item.price.toLocaleString()
                  : Number(item.price || 0).toLocaleString()
              )} د.ب
            </Text>
          </LinearGradient>

          {/* Type badge — colored pill */}
          <View style={[styles.typeBadge, { backgroundColor: typeAccent }]}>
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {toText(getListingTitle(item))}
          </Text>

          <View style={[styles.separator, { backgroundColor: theme.border }]} />

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <Ionicons name="location-sharp" size={11} color={typeAccent} />
              <Text style={[styles.metaText, { color: theme.subText }]}>{toText(getListingCity(item), 'البحرين')}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={11} color={theme.muted} />
              <Text style={[styles.metaText, { color: theme.muted }]}>{toText(formatTimeAgo(item.postedAt || item.createdAt))}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={theme.background} />
      {/* Watermark Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
         <Image 
           source={require('@/assets/images/logo.png')} 
           style={styles.watermark}
           contentFit="contain"
         />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        {/* ── Header: dark navy (light) / gold (dark) ── */}
        <LinearGradient
          colors={['#0E1830', '#162444']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.logoContainer, { width: '100%', alignSelf: 'stretch' }]}
        >
          <View style={styles.headerTopRow}>
            {/* Logo absolutely centered */}
            <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 0 }} pointerEvents="none">
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>

            {/* Left side: Notification bell + Search */}
            <View style={{ flexDirection: 'row', gap: 8, zIndex: 1 }}>
              <TouchableOpacity
                onPress={() => router.push('/notifications')}
                style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
              >
                <Ionicons name="notifications" size={22} color='#D4AF37' />
                {unreadCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Search */}
              <TouchableOpacity
                onPress={() => router.push('/search')}
                style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
              >
                <Ionicons name="search" size={22} color='#D4AF37' />
              </TouchableOpacity>
            </View>

            {/* Favorites heart */}
            <TouchableOpacity
              onPress={() => router.push('/favorites')}
              style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
            >
              <Ionicons name="heart" size={22} color='#D4AF37' />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Subscription Promo — shown only to logged-in users without an active package */}
        <SubscriptionPromoCard />

        {/* Stories Rail */}
        <StoriesRail
          onAddStory={handleAddStory}
          onPressStory={handleStoryPress}
          refreshTrigger={storiesRefreshTrigger}
        />

        {/* FilterHeader خارج SectionList */}
        <View style={{ backgroundColor: theme.surface, zIndex: 20, elevation: 6 }}>
          <FilterHeader 
            selectedFilter={selectedFilter} 
            onSelect={handleFilterChange} 
            theme={theme} 
          />
        </View>

        <SectionList
          sections={sectionData}
          stickySectionHeadersEnabled={false}
          removeClippedSubviews={false}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          contentContainerStyle={[
            styles.listContainer, 
            { 
              paddingHorizontal: 0,
              paddingBottom: Math.max(160, 32 + Math.max(insets.bottom, 16)),
            }
          ]}
          ListHeaderComponent={luckWinner ? <LuckWinnerBanner winner={luckWinner} /> : undefined}
          renderSectionHeader={undefined}
          renderItem={({ item }) => {
            if (item.type === 'HEADER_TITLE') {
              return (
                <View style={{ width: '100%', paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row-reverse' }}>
                  <View>
                    <Text style={{ fontSize: 20, fontWeight: '800', textAlign: 'right', color: theme.text, writingDirection: 'rtl' }}>أحدث العروض</Text>
                    <View style={{ height: 3, width: 40, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 4 }} />
                  </View>
                </View>
              );
            }

            if (item.type === 'CATEGORY_SECTION') {
              return (
                <View style={{ marginBottom: 4 }}>
                  <View style={{
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingTop: 20,
                    paddingBottom: 12,
                  }}>
                    <View>
                      <Text style={{ fontSize: 18, fontWeight: '800', textAlign: 'right', color: theme.text }}>{item.title}</Text>
                      <View style={{ height: 3, width: 36, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 4 }} />
                    </View>
                    {item.filterType && (
                      <TouchableOpacity onPress={() => handleFilterChange(item.filterType)}>
                        <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>عرض الكل ←</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ transform: [{ scaleX: -1 }] }}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  >
                    {item.items.map((listing: any) => (
                      <View key={listing.id} style={{ transform: [{ scaleX: -1 }] }}>
                        {renderListingCard({ item: listing })}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              );
            }

            if (item.type === 'AD_BANNER') {
              return <AdsBanner />;
            }

            if (item.type === 'ROW') {
              return (
                <View style={[styles.row, { paddingHorizontal: 16 }]}> 
                    {item.items && item.items[0] && renderListingCard({ item: item.items[0] })}
                    {item.items && item.items[1] ? (
                      renderListingCard({ item: item.items[1] })
                    ) : (
                      <View style={{ width: CARD_WIDTH }} />
                    )}
                </View>
              );
            }
            return null;
          }}
          ListEmptyComponent={
            !loading && filteredListings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="car-sport-outline" size={60} color="#e5e5e5" />
                <Text style={[styles.emptyText, { color: theme.muted, marginTop: 10 }]}>لا توجد إعلانات مطابقة</Text>
              </View>
            ) : null
          }
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}> 
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}> 
                  {filterStep === 'BRAND' ? 'اختر الماركة' : 
                  filterStep === 'MOTO_BRAND' ? 'اختر الشركة المصنعة' :
                  filterStep === 'PLATE_TYPE' ? 'اختر نوع اللوحة' :
                  'اختر الموديل'}
                </Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              
              {filterStep === 'BRAND' && (
                <FlatList
                  data={CarBrands}
                  keyExtractor={(item, index) => getKey(item?.id ?? item?.name, index, 'brand')}
                  numColumns={3}
                  contentContainerStyle={styles.brandGrid}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.brandItem, { borderColor: theme.border }]} 
                      onPress={() => handleBrandSelect(item)}
                    >
                      <View style={styles.brandLogoContainer}>
                        <Image 
                          source={{ uri: item.logo }} 
                          style={styles.brandLogo} 
                          contentFit="contain"
                          transition={200}
                        />
                      </View>
                      <Text style={[styles.brandName, { color: theme.text }]}>{toText(item.nameAr ?? item.name)}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              {filterStep === 'MOTO_BRAND' && (
                <FlatList
                  data={MotorcycleBrands}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  contentContainerStyle={styles.brandGrid}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.brandItem, { borderColor: theme.border }]} 
                      onPress={() => handleMotoBrandSelect(item)}
                    >
                      <View style={styles.brandLogoContainer}>
                        <Image 
                          source={{ uri: item.logo }} 
                          style={styles.brandLogo} 
                          contentFit="contain"
                          transition={200}
                        />
                      </View>
                      <Text style={[styles.brandName, { color: theme.text }]}>{toText(item.nameAr ?? item.name)}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              {filterStep === 'PLATE_TYPE' && (
                <View style={styles.modelList}>
                  {[
                    { id: 'ALL', label: 'الكل' },
                    { id: 'PRIVATE', label: 'خصوصي' },
                    { id: 'TRANSPORT', label: 'نقل' },
                    { id: 'MOTORCYCLE', label: 'دراجة نارية' }
                  ].map((pt) => (
                    <TouchableOpacity 
                        key={pt.id}
                        style={[styles.modelItem, { borderBottomColor: theme.border }]} 
                        onPress={() => handlePlateTypeSelect(pt.id)}
                      >
                        <Text style={[styles.modelName, { color: theme.text }]}>{pt.label}</Text>
                        <Ionicons name="chevron-back" size={20} color={theme.muted} />
                      </TouchableOpacity>
                  ))}
                </View>
              )}

              {filterStep === 'MODEL' && (
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => setFilterStep('BRAND')} style={styles.backButton}>
                  <Ionicons name="arrow-forward" size={20} color={theme.primary} />
                  <Text style={[styles.backText, { color: theme.primary }]}>العودة للماركات</Text>
                  </TouchableOpacity>
                  <FlatList<SafeModelItem>
                    data={buildSafeModelItems(selectedBrand)}
                    keyExtractor={(item: SafeModelItem) => item.key}
                    contentContainerStyle={styles.modelList}
                    renderItem={({ item }: { item: SafeModelItem }) => (
                      <TouchableOpacity 
                        style={[styles.modelItem, { borderBottomColor: theme.border }]} 
                        onPress={() => handleModelSelect(item)}
                      >
                        <Text style={[styles.modelName, { color: theme.text }]}> 
                          {item.label}
                        </Text>
                        <Ionicons name="chevron-back" size={20} color={theme.muted} />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </View>
        </Modal>

        <AddStoryModal
          visible={addStoryVisible}
          onClose={() => setAddStoryVisible(false)}
          onSuccess={handleStorySuccess}
        />

        <StoryViewer
          visible={viewerVisible}
          storyUsers={viewerStories}
          initialUserIndex={viewerInitialIndex}
          initialUserId={viewerInitialUserId}
          onClose={() => setViewerVisible(false)}
        />

      </SafeAreaView>
    </View>
  );
}