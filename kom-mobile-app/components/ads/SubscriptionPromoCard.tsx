/**
 * SubscriptionPromoCard
 * Shown ONLY to logged-in users who do not yet have an active subscription/package.
 * Fetches the cheapest active package and promotes it with a CTA.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

interface PromoPackage {
  id: string;
  name: string;
  priceMonthly?: number;  // Showroom
  price?: number;         // Individual
  maxListings: number;
  maxStories?: number;
  durationDays?: number;
}

export default function SubscriptionPromoCard() {
  const { isAuthenticated, user } = useAuthStore();
  const [promoPackage, setPromoPackage] = useState<PromoPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null); // null = not checked yet

  const isShowroom = user?.role === 'USER_SHOWROOM';
  const isIndividual = user?.role === 'USER_INDIVIDUAL';

  useEffect(() => {
    if (!isAuthenticated || (!isShowroom && !isIndividual)) {
      setHasSubscription(true); // hide card for guests/admins
      return;
    }
    checkAndFetch();
  }, [isAuthenticated, user?.role]);

  const checkAndFetch = async () => {
    setLoading(true);
    try {
      if (isShowroom) {
        // Check if showroom already has an active subscription
        const subRes = await api.get('/packages/my-subscription');
        const sub = subRes.data?.data ?? subRes.data;
        if (sub && sub.status === 'ACTIVE') {
          setHasSubscription(true);
          return;
        }
        // Fetch cheapest showroom package
        const pkgRes = await api.get('/packages');
        const pkgs: PromoPackage[] = pkgRes.data?.data ?? pkgRes.data ?? [];
        if (pkgs.length > 0) {
          // Sort by priceMonthly ascending, pick cheapest
          const sorted = [...pkgs].sort((a, b) => (a.priceMonthly ?? 0) - (b.priceMonthly ?? 0));
          setPromoPackage(sorted[0]);
        }
      } else if (isIndividual) {
        // Check if individual has any active credits
        const credRes = await api.get('/packages/my-credits');
        const credits = credRes.data?.data ?? credRes.data ?? [];
        if (Array.isArray(credits) && credits.length > 0) {
          setHasSubscription(true);
          return;
        }
        // Fetch cheapest individual package
        const pkgRes = await api.get('/packages/individual');
        const pkgs: PromoPackage[] = pkgRes.data?.data ?? pkgRes.data ?? [];
        if (pkgs.length > 0) {
          const sorted = [...pkgs].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
          setPromoPackage(sorted[0]);
        }
      }
      setHasSubscription(false);
    } catch {
      setHasSubscription(true); // on error, hide card silently
    } finally {
      setLoading(false);
    }
  };

  // Don't render until check is done, or if user has subscription, or not logged in
  if (!isAuthenticated || hasSubscription !== false || loading) return null;
  if (!promoPackage) return null;

  const price = promoPackage.priceMonthly ?? promoPackage.price ?? 0;
  const targetRoute = isShowroom ? '/(tabs)/profile/subscriptions' : '/(tabs)/profile/individual-packages';

  return (
    <TouchableOpacity
      style={styles.wrapper}
      activeOpacity={0.88}
      onPress={() => router.push(targetRoute as any)}
    >
      <LinearGradient
        colors={['#0E1830', '#162444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Dismiss indicator */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="star" size={11} color="#0E1830" />
            <Text style={styles.badgeText}>عرض خاص</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Package name & price */}
          <View style={styles.priceBlock}>
            <Text style={styles.priceAmount}>{Number(price).toFixed(3)}</Text>
            <View>
              <Text style={styles.priceCurrency}>د.ب</Text>
              <Text style={styles.priceFreq}>/ شهر</Text>
            </View>
          </View>

          <Text style={styles.pkgName} numberOfLines={1}>{promoPackage.name}</Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
              <Text style={styles.featureText}>
                حتى {promoPackage.maxListings} إعلانات نشطة
              </Text>
            </View>
            {promoPackage.maxStories !== undefined && promoPackage.maxStories > 0 && (
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                <Text style={styles.featureText}>
                  {promoPackage.maxStories} قصص مميزة
                </Text>
              </View>
            )}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push(targetRoute as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>اشترك الآن</Text>
            <Ionicons name="arrow-back" size={14} color="#0E1830" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 16,
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    color: '#0E1830',
    fontSize: 11,
    fontWeight: '800',
  },
  body: {
    alignItems: 'flex-end',
  },
  priceBlock: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#D4AF37',
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'right',
  },
  priceFreq: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  pkgName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'right',
    marginBottom: 6,
  },
  features: {
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
  },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E1830',
  },
});
