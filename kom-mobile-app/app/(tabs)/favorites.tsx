import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';

interface FavoriteListing {
  id: string;
  title: string;
  price: number;
  location: string;
  media: Array<{
    url: string;
    type: string;
  }>;
  type: string;
  createdAt: string;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const theme = {
    background: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#111827' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#1f2937' : '#e2e8f0',
    surface: isDark ? '#0b1220' : '#f1f5f9',
    primary: '#D4AF37',
  };

  const fetchFavorites = async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('Fetching favorites...');
      const response = await api.get('/listings/favorites');
      console.log('Favorites response status:', response.status);
      console.log('Favorites data:', JSON.stringify(response.data, null, 2));
      
      // Handle nested data structure from paginated response
      // Structure is: { success: true, data: { data: [...], pagination: ... } }
      let favoritesArray = [];
      if (response.data?.data && Array.isArray(response.data.data.data)) {
        favoritesArray = response.data.data.data;
      } else if (Array.isArray(response.data?.data)) {
        favoritesArray = response.data.data;
      } else if (Array.isArray(response.data)) {
        favoritesArray = response.data;
      }
      
      console.log('Parsed favorites count:', favoritesArray.length);
      setFavorites(favoritesArray);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      if (err?.response?.status === 401) {
        // User not authenticated
        console.warn('User not authenticated for favorites');
        setFavorites([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const onRefresh = useCallback(() => {
    if (isAuthenticated) {
      setRefreshing(true);
      fetchFavorites();
    }
  }, [isAuthenticated]);

  const handleRemoveFavorite = async (listingId: string) => {
    try {
      await api.delete(`/listings/${listingId}/favorite`);
      setFavorites(prev => prev.filter(item => item.id !== listingId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  const renderItem = ({ item }: { item: FavoriteListing }) => {
    const imageUrl = (item.media?.find((m: any) => m?.type === 'IMAGE' || m?.type === 'image') ?? item.media?.[0])?.url || 'https://placehold.co/400x300/e2e8f0/1e293b?text=No+Image';
    
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card }]}
        onPress={() => router.push(`/listing/${item.id}`)}
        activeOpacity={0.88}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          <View style={styles.watermarkContainer} pointerEvents="none">
            <Image 
              source={require('@/assets/images/logo.png')}
              style={styles.watermarkImage}
              resizeMode="contain"
            />
          </View>
          {/* Gradient overlay */}
          <View style={styles.imgGradient} />
        </View>
        
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRemoveFavorite(item.id);
          }}
        >
          <Ionicons name="heart" size={20} color="#EF4444" />
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text style={[styles.price]}>
            {Number(item.price).toLocaleString()} <Text style={styles.currency}>د.ب</Text>
          </Text>

          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-sharp" size={12} color="#9BA3B2" />
            <Text style={[styles.location, { color: theme.textMuted }]} numberOfLines={1}>{item.location}</Text>
          </View>
        </View>

        {/* Accent stripe by type */}
        <View style={[styles.accentStripe, {
          backgroundColor:
            item.type === 'CAR' ? '#3B82F6' :
            item.type === 'MOTORCYCLE' ? '#8B5CF6' :
            item.type === 'PLATE' ? '#059669' : '#F59E0B'
        }]} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <PageHeader
          title="المفضلة"
          variant="gradient"
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <PageHeader
        title="المفضلة"
        variant="gradient"
        onBack={() => router.replace('/')} 
      />
      
      {!isAuthenticated ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>تسجيل الدخول مطلوب</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted, marginBottom: 24 }]}>
            يرجى تسجيل الدخول لمشاهدة إعلاناتك المفضلة
          </Text>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: theme.primary }]} 
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>لا توجد إعلانات مفضلة</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>أضف إعلاناتك المفضلة لتسهيل الوصول إليها</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
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
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: 10,
    paddingBottom: 130,
  },
  row: {
    justifyContent: 'space-between',
  },
  // ─── Card ────────────────────────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    margin: 6,
    overflow: 'hidden',
    shadowColor: '#1A2050',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
    maxWidth: '48%',
    borderWidth: 1,
    borderColor: '#EEF2FA',
  },
  imageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: '#EEF2FA',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imgGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'transparent',
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  watermarkImage: {
    width: 44,
    height: 44,
    opacity: 0.12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 12,
    paddingLeft: 16,
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D4AF37',
    marginBottom: 4,
    textAlign: 'right',
  },
  currency: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9BA3B2',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 19,
    width: '100%',
  },
  locationContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  loginButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 20,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#0A0B14',
    fontWeight: '800',
    fontSize: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  typeTag: {}, typeText: {}, date: {},
});
