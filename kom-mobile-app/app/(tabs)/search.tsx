import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useAppTranslation, useLanguage } from '@/context/LanguageContext';
import { Colors } from '@/constants/Colors';
import { CarBrands, MotorcycleBrands, VehicleColors } from '@/constants/CarData';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ============================================
// HELPER FUNCTIONS FROM INDEX.TSX
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

function getKey(value: unknown, index: number, prefix: string = 'item'): string {
  const str = safeString(value);
  if (str) {
    return `${prefix}-${str}-${index}`;
  }
  return `${prefix}-${index}`;
}

type SafeModelItem = {
  key: string;
  label: string;
  valueEn: string;
  valueAr: string;
};

type VehicleBrand = (typeof CarBrands)[number];

const SEARCH_CAR_BRANDS = CarBrands.filter((brand) => brand.id !== 'all');
const SEARCH_MOTORCYCLE_BRANDS = MotorcycleBrands.filter((brand) => brand.id !== 'all');

function getListingVehicleSpecs(item: any) {
  const car = item?.carDetails || item?.details?.car || item?.car || null;
  const motorcycle = item?.motorcycleDetails || item?.details?.motorcycle || item?.motorcycle || null;
  const specs = car || motorcycle || item || {};

  return {
    make: safeString(specs?.make || item?.make),
    model: safeString(specs?.model || item?.model),
    year: safeString(specs?.year || item?.year),
    color: safeString(specs?.color || item?.color),
  };
}

function buildSafeModelItems(
  brand: { models?: unknown[] } | null | undefined,
  language: 'ar' | 'en',
  t: (key: string, options?: Record<string, unknown>) => string,
): SafeModelItem[] {
  const result: SafeModelItem[] = [];
  result.push({
    key: 'safe-model-all',
    label: t('search.categoryAll'),
    valueEn: '__ALL__',
    valueAr: '__ALL__',
  });
  
  const rawModels = Array.isArray(brand?.models) ? brand.models : [];
  
  for (let i = 0; i < rawModels.length; i++) {
    const model = rawModels[i];
    let labelStr: string, enStr: string, arStr: string;
    
    if (typeof model === 'string') {
      labelStr = model; enStr = model; arStr = model;
    } else if (model && typeof model === 'object') {
      const modelObj = model as Record<string, unknown>;
      enStr = typeof modelObj.en === 'string' ? modelObj.en : '';
      arStr = typeof modelObj.ar === 'string' ? modelObj.ar : '';
      labelStr = language === 'ar' ? (arStr || enStr) : (enStr || arStr);
      labelStr = labelStr || t('search.modelFallback', { index: i + 1 });
      if (!enStr) enStr = arStr || `model_${i}`;
      if (!arStr) arStr = enStr;
    } else {
      labelStr = t('search.modelFallback', { index: i + 1 }); enStr = `unknown_model_${i}`; arStr = labelStr;
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
    label: t('common.other'),
    valueEn: '__OTHER__',
    valueAr: '__OTHER__',
  });
  
  return result;
}

// ============================================
// TYPES & CONSTANTS
// ============================================
type Category = 'ALL' | 'CAR' | 'MOTORCYCLE' | 'PLATE' | 'PART';
type SortOption = 'price_desc' | 'price_asc' | 'date_desc' | 'date_asc';

const years = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

export default function SearchScreen() {
  const { isDark } = useTheme();
  const { t } = useAppTranslation();
  const { language, isRTL } = useLanguage();
  
  // Theme Definition
  const theme = {
    background: isDark ? '#0B0F1E' : '#F2F5FC',
    surface:    isDark ? '#111827' : '#FFFFFF',
    border:     isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    text:       isDark ? '#F8FAFC' : '#0A0B14',
    subText:    isDark ? '#CBD5E1' : '#6B7280',
    muted:      isDark ? '#64748B' : '#94A3B8',
    primary: Colors.primary,
    cardBg: isDark ? '#111827' : '#FFFFFF',
  };

  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Filter State
  const [modalVisible, setModalVisible] = useState(false);
  const [tempCategory, setTempCategory] = useState<Category>('ALL'); // For modal logic before apply
  
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<SafeModelItem | null>(null);
  
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const [appliedFilters, setAppliedFilters] = useState({
     category: 'ALL',
      make: null as VehicleBrand | null,
      model: null as SafeModelItem | null,
     year: '',
     color: '',
     sort: 'date_desc' as SortOption
  });

    const visibleBrands = useMemo(
     () => (tempCategory === 'MOTORCYCLE' ? SEARCH_MOTORCYCLE_BRANDS : SEARCH_CAR_BRANDS),
     [tempCategory]
    );

  const fetchListings = useCallback(async (
    searchQuery: string,
    filters: typeof appliedFilters
  ) => {
    setLoading(true);
    try {
      // Build sort param for API
      let sortParam: string;
      if (filters.sort === 'price_asc') sortParam = 'price_asc';
      else if (filters.sort === 'price_desc') sortParam = 'price_desc';
      else if (filters.sort === 'date_asc') sortParam = 'oldest';
      else sortParam = 'newest';

      const params: any = { status: 'APPROVED', limit: 100, sort: sortParam };
      if (searchQuery) params.search = searchQuery;
      if (filters.category !== 'ALL') params.type = filters.category;

      const selectedMake = filters.make
        ? (filters.make.nameAr || filters.make.name || '').trim()
        : '';
      if (selectedMake && (filters.category === 'CAR' || filters.category === 'MOTORCYCLE')) {
        params.make = selectedMake;
      }

      const selectedModel = filters.model?.valueAr?.trim();
      if (
        selectedModel &&
        selectedModel !== '__ALL__' &&
        selectedModel !== '__OTHER__' &&
        (filters.category === 'CAR' || filters.category === 'MOTORCYCLE')
      ) {
        params.model = selectedModel;
      }

      if (filters.year && (filters.category === 'CAR' || filters.category === 'MOTORCYCLE')) {
        const exactYear = Number(filters.year);
        if (!Number.isNaN(exactYear)) {
          params.yearMin = exactYear;
          params.yearMax = exactYear;
        }
      }

      if (filters.color && (filters.category === 'CAR' || filters.category === 'MOTORCYCLE')) {
        params.color = filters.color.trim();
      }

      const response = await api.get('/listings', { params });
      const payload = response.data?.data ?? response.data;
      let data: any[] = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.items) ? payload.items : []);

      // Client-side filtering remains as a fallback for any backend drift.
      if (filters.category !== 'ALL') {
        data = data.filter(item => item.type === filters.category);
      }
      if (filters.make) {
        const makeName = (filters.make.nameAr || filters.make.name || '').toLowerCase();
        data = data.filter(item => getListingVehicleSpecs(item).make.toLowerCase() === makeName);
      }
      if (filters.model) {
        const val = filters.model.valueAr;
        if (val && val !== '__ALL__' && val !== '__OTHER__') {
          data = data.filter(item => getListingVehicleSpecs(item).model === val);
        }
      }
      if (filters.year) {
        data = data.filter(item => getListingVehicleSpecs(item).year === filters.year);
      }
      if (filters.color) {
        data = data.filter(item => getListingVehicleSpecs(item).color.trim() === filters.color.trim());
      }

      setListings(data);
    } catch (error) {
      console.error('Search error:', error);
      setListings([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  // Debounce Search
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchListings(query, appliedFilters); // immediate on mount
      return;
    }
    const timer = setTimeout(() => {
       fetchListings(query, appliedFilters);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, appliedFilters]);

  const openFilterModal = () => {
    // Sync temp state with applied filters
    setTempCategory(appliedFilters.category as Category);
    setSelectedBrand(appliedFilters.make);
    setSelectedModel(appliedFilters.model);
    setSelectedYear(appliedFilters.year);
    setSelectedColor(appliedFilters.color);
    setSortOption(appliedFilters.sort);
    
    setModalVisible(true);
  };

  const applyFilters = () => {
    setAppliedFilters({
       category: tempCategory,
       make: selectedBrand,
       model: selectedModel,
       year: selectedYear,
       color: selectedColor,
       sort: sortOption
    });
    setModalVisible(false);
  };

  const resetFilters = () => {
    setTempCategory('ALL');
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedYear('');
    setSelectedColor('');
    setSortOption('date_desc');
  };

  const getListingTitle = (item: any) => safeString(item?.title, '');
  const getListingCity = (item: any) => safeString(item?.city, t('common.bahrain'));
  const toText = safeString;
  const getBrandLabel = (brand: any) => language === 'ar' ? (brand?.nameAr || brand?.name || '') : (brand?.name || brand?.nameAr || '');
  const getTypeLabel = (type: string) => (
    type === 'PLATE' ? t('listing.types.plate') :
    type === 'MOTORCYCLE' ? t('listing.types.motorcycle') :
    type === 'PART' ? t('listing.types.part') : t('listing.types.car')
  );

  const getImageUri = (item: any) => {
    const media = item?.media;
    if (Array.isArray(media) && media.length > 0) {
      // Prefer IMAGE type; fall back to first item if no type field
      const imageMedia = media.find((m: any) => m?.type === 'IMAGE' || m?.type === 'image') ?? media[0];
      if (imageMedia?.url) return imageMedia.url;
    }
    const images = item?.images;
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object' && 'url' in first) return first.url;
    }
    return null;
  };

  const renderListingCard = ({ item }: { item: any }) => {
    const imageUri = getImageUri(item);
    const typeAccent =
      item.type === 'MOTORCYCLE' ? '#8B5CF6' :
      item.type === 'PLATE'      ? '#059669' :
      item.type === 'PART'       ? '#F59E0B' :
      '#3B82F6';
    const typeLabel = getTypeLabel(item.type);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.cardBg }]}
        onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id, backLink: '/search' } })}
        activeOpacity={0.85}
      >
        {/* Top accent bar */}
        <View style={{ height: 3, backgroundColor: typeAccent }} />
        {imageUri ? (
          <View style={{ position: 'relative' }}>
            <Image source={{ uri: imageUri }} style={styles.cardImage} contentFit="cover" />
            {/* Price overlay */}
            <LinearGradient
              colors={['transparent','rgba(0,0,0,0.72)']}
              start={{x:0,y:0}}
              end={{x:0,y:1}}
              style={[styles.priceOverlay, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}
            >
              <Text style={[styles.priceText, { textAlign: isRTL ? 'left' : 'right' }]}>
                {toText(typeof item.price === 'number' ? item.price.toLocaleString() : Number(item.price||0).toLocaleString())} {t('common.bhd')}
              </Text>
            </LinearGradient>
            {/* Type badge */}
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: typeAccent },
                isRTL ? { left: 8, right: undefined } : { right: 8, left: undefined },
              ]}
            >
              <Text style={styles.typeBadgeText}>{typeLabel}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.cardImage, styles.noImage, { backgroundColor: typeAccent + '18' }]}>
            <Ionicons name="car-outline" size={32} color={typeAccent} />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {toText(getListingTitle(item))}
          </Text>
          <View style={styles.cardFooterRow}>
            <View style={styles.cardMetaItem}>
              <Ionicons name="location-sharp" size={11} color={typeAccent} />
              <Text style={[styles.cardMetaText, { color: theme.muted }]}>{toText(getListingCity(item))}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Helper Wrappers for Render
  const renderSortOption = (label: string, value: SortOption) => (
      <TouchableOpacity 
        style={[styles.radioButton, { borderColor: theme.border }, sortOption === value && styles.radioButtonSelected]} 
        onPress={() => setSortOption(value)}
      >
        <Text style={[styles.radioText, { color: sortOption === value ? '#fff' : theme.text }]}>{label}</Text>
      </TouchableOpacity>
  );

  const renderCategoryTab = (label: string, value: Category) => (
      <TouchableOpacity 
         style={[styles.tabItem, tempCategory === value && styles.tabItemSelected]}
         onPress={() => {
             setTempCategory(value);
             // Verify if brand needs reset when switching categories
             if (value !== 'CAR' && value !== 'MOTORCYCLE') {
                 setSelectedBrand(null);
                 setSelectedModel(null);
             } else if (value === 'CAR' && selectedBrand && !SEARCH_CAR_BRANDS.find(b => b.id === selectedBrand.id)) {
                 setSelectedBrand(null);
                 setSelectedModel(null);
             } else if (value === 'MOTORCYCLE' && selectedBrand && !SEARCH_MOTORCYCLE_BRANDS.find(b => b.id === selectedBrand.id)) {
                 setSelectedBrand(null);
                 setSelectedModel(null);
             }
         }}
      >
          <Text style={[styles.tabText, tempCategory === value && styles.tabTextSelected]}>{label}</Text>
      </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
      {/* Header — navy gradient */}
      <LinearGradient colors={['#0E1830','#162444']} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.header, { flexDirection: 'row' }]}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.navBtn}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={[styles.searchBar, { flexDirection: 'row' }]}>
          <Ionicons name="search" size={17} color="#D4AF37" />
          <TextInput
            style={[styles.input, { color: '#FFFFFF' }]}
            placeholder={t('search.placeholder')}
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={query}
            onChangeText={setQuery}
                      />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={openFilterModal} style={styles.navBtn}>
          <Ionicons name="options" size={20} color="#D4AF37" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListingCard}
          keyExtractor={(item, index) => getKey(item?.id ?? item?._id, index, 'search-item')}
          numColumns={2}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 160 }]}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled" 
          ListEmptyComponent={
             <View style={styles.centered}>
               <Text style={{ color: theme.muted }}>{t('search.noResults')}</Text>
             </View>
          }
        />
      )}

      </KeyboardAvoidingView>

      {/* FILTER MODAL */}
      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView edges={['top']} style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text, textAlign: 'auto'}]}>{t('search.filterTitle')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
                
                {/* Categories */}
                <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'auto' }]}>{t('search.category')}</Text>
                <View style={[styles.tabsContainer, { flexDirection: 'row' }]}>
                  {renderCategoryTab(t('search.categoryAll'), 'ALL')}
                  {renderCategoryTab(t('search.categoryCars'), 'CAR')}
                  {renderCategoryTab(t('search.categoryMotorcycles'), 'MOTORCYCLE')}
                  {renderCategoryTab(t('search.categoryPlates'), 'PLATE')}
                  {renderCategoryTab(t('search.categoryParts'), 'PART')}
                </View>

                {/* Sort By */}
                <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'auto' }]}>{t('search.sort')}</Text>
                <View style={[styles.radioGroup, { flexDirection: 'row' }]}>
                  {renderSortOption(t('search.sortDateNewest'), 'date_desc')}
                  {renderSortOption(t('search.sortDateOldest'), 'date_asc')}
                  {renderSortOption(t('search.sortPriceLowest'), 'price_asc')}
                  {renderSortOption(t('search.sortPriceHighest'), 'price_desc')}
                </View>

                {/* Make & Model (Only for Car/Moto) */}
                {(tempCategory === 'CAR' || tempCategory === 'MOTORCYCLE') && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'auto' }]}>{t('search.make')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                          {visibleBrands.map((brand) => (
                                <TouchableOpacity
                                    key={brand.id}
                                    style={[
                                        styles.brandChip, 
                                        { borderColor: theme.border },
                                        selectedBrand?.id === brand.id && styles.brandChipSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedBrand(brand);
                                        setSelectedModel(null); // Reset model
                                    }}
                                >
                                    <Image source={{ uri: brand.logo }} style={styles.brandLogo} contentFit="contain" />
                                    <Text style={[styles.brandName, { color: selectedBrand?.id === brand.id ? '#fff' : theme.text, textAlign: 'auto' }]}>
                                      {getBrandLabel(brand)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        
                        {/* Models */}
                        {selectedBrand && (
                           <>
                              <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'auto' }]}>{t('search.model')}</Text>
                             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                {buildSafeModelItems(selectedBrand, language, t as any).map((model) => (
                                    <TouchableOpacity
                                        key={model.key}
                                        style={[
                                            styles.chip,
                                            { borderColor: theme.border },
                                            selectedModel?.key === model.key && styles.chipSelected
                                        ]}
                                        onPress={() => setSelectedModel(model)}
                                    >
                                        <Text style={[styles.chipText, { color: selectedModel?.key === model.key ? '#fff' : theme.text, textAlign: 'auto' }]}>
                                            {model.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                             </ScrollView>
                           </>
                        )}
                        
                        {/* Year */}
                        <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'auto' }]}>{t('search.year')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            <TouchableOpacity
                                style={[styles.chip, { borderColor: theme.border }, selectedYear === '' && styles.chipSelected]}
                                onPress={() => setSelectedYear('')}
                            >
                                <Text style={[styles.chipText, { color: selectedYear === '' ? '#fff' : theme.text, textAlign: 'auto' }]}>{t('search.categoryAll')}</Text>
                            </TouchableOpacity>
                            {years.map(year => (
                                <TouchableOpacity
                                    key={year}
                                    style={[
                                        styles.chip,
                                        { borderColor: theme.border },
                                        selectedYear === year && styles.chipSelected
                                    ]}
                                    onPress={() => setSelectedYear(year === selectedYear ? '' : year)}
                                >
                                    <Text style={[styles.chipText, { color: selectedYear === year ? '#fff' : theme.text }]}>{year}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Color */}
                        <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'auto' }]}>{t('search.color')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                             <TouchableOpacity
                                style={[styles.chip, { borderColor: theme.border }, selectedColor === '' && styles.chipSelected]}
                                onPress={() => setSelectedColor('')}
                            >
                                <Text style={[styles.chipText, { color: selectedColor === '' ? '#fff' : theme.text, textAlign: 'auto' }]}>{t('search.categoryAll')}</Text>
                            </TouchableOpacity>
                            {VehicleColors.map(color => (
                                 <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.chip,
                                        { borderColor: theme.border },
                                        selectedColor === color && styles.chipSelected
                                    ]}
                                    onPress={() => setSelectedColor(color === selectedColor ? '' : color)}
                                >
                                    <Text style={[styles.chipText, { color: selectedColor === color ? '#fff' : theme.text }]}>{color}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={[styles.resetButtonText, { color: theme.text }]}>{t('search.reset')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>{t('search.apply')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    gap: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  listContainer: { padding: 16, paddingBottom: 150 },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      default: { shadowColor: '#1A2050', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 6 },
    }),
  },
  cardImage: { width: '100%', height: 130, backgroundColor: '#EEF2FA' },
  priceOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, justifyContent: 'flex-end', alignItems: 'flex-end', paddingHorizontal: 10, paddingBottom: 6 },
  priceText: { color: '#D4AF37', fontSize: 17, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  typeBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  typeBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  noImage: { justifyContent: 'center', alignItems: 'center' },
  noImageText: { fontSize: 12 },
  cardContent: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', marginBottom: 5 },
  cardFooterRow: { flexDirection: 'row', marginTop: 4 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMetaText: { fontSize: 10, fontWeight: '500' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  
  // Modal Styles
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingEnd: 0, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalContent: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 16, width: '100%' },
  
  tabsContainer: { flexWrap: 'wrap', gap: 8 },
  tabItem: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabItemSelected: { backgroundColor: '#0E1830' },
  tabText: { fontSize: 14, color: '#0A0B14' },
  tabTextSelected: { color: '#D4AF37', fontWeight: '700' },

  radioGroup: { flexWrap: 'wrap', gap: 8 },
  radioButton: { borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12 },
  radioButtonSelected: { backgroundColor: '#0E1830', borderColor: '#D4AF37' },
  radioText: { fontSize: 13 },

  horizontalScroll: { marginBottom: 8 },
  brandChip: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderRadius: 12, marginStart: 8, minWidth: 100, gap: 8 },
  brandChipSelected: { backgroundColor: '#0E1830', borderColor: '#D4AF37' },
  brandLogo: { width: 24, height: 24 },
  brandName: { fontSize: 13 },

  chip: { paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: 20, marginStart: 8 },
  chipSelected: { backgroundColor: '#0E1830', borderColor: '#D4AF37' },
  chipText: { fontSize: 14 },

  modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  applyButton: { flex: 1, backgroundColor: '#D4AF37', borderRadius: 22, paddingVertical: 14, alignItems: 'center' },
  applyButtonText: { color: '#0A0B14', fontSize: 15, fontWeight: '800' },
  resetButton: { flex: 1, borderRadius: 22, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  resetButtonText: { fontSize: 15 },
});
