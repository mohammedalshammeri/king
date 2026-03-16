import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import api from '@/services/api';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = Math.round(width / 3); // 3:1 ratio
const AUTO_PLAY_INTERVAL = 4000; // 4 seconds

interface Advertisement {
  id: string;
  title?: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  thumbnailUrl?: string;
  linkUrl?: string;
}

interface AdsBannerProps {
  onPress?: (ad: Advertisement) => void;
}

// Separate component so useVideoPlayer hook is called per-video
function VideoAdItem({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function AdsBanner({ onPress }: AdsBannerProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchAds();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % ads.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_PLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ads.length]);

  const fetchAds = async () => {
    try {
      const res = await api.get('/advertisements');
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) {
        setAds(data);
        // Track view for each ad silently
        data.forEach((ad: Advertisement) => {
          api.post(`/advertisements/${ad.id}/view`).catch(() => {});
        });
      }
    } catch (e) {
      // Silent fail — ads are optional
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleAdPress = (ad: Advertisement) => {
    if (!ad.linkUrl) return;
    // Track click
    api.post(`/advertisements/${ad.id}/click`).catch(() => {});
    onPress && onPress(ad);
  };

  if (loading) {
    // Skeleton placeholder while loading
    return <View style={[styles.container, styles.skeleton]} />;
  }

  if (ads.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={ads}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={item.linkUrl ? 0.85 : 1}
            onPress={() => handleAdPress(item)}
            style={styles.slide}
          >
            {item.mediaType === 'VIDEO' ? (
              <VideoAdItem uri={item.mediaUrl} style={styles.media} />
            ) : (
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.media}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
              />
            )}
          </TouchableOpacity>
        )}
      />

      {/* Dot indicators */}
      {ads.length > 1 && (
        <View style={styles.dotsContainer}>
          {ads.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width,
    height: BANNER_HEIGHT + 16,
    backgroundColor: 'transparent',
    marginTop: 24,
    marginBottom: 8,
  },
  container: {
    width,
    height: BANNER_HEIGHT,
  },
  skeleton: {
    backgroundColor: '#1e2040',
    opacity: 0.6,
  },
  slide: {
    width,
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 5,
  },
  dot: {
    borderRadius: 4,
    height: 4,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#D4AF37',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
