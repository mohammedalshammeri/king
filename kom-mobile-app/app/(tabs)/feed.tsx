import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  Dimensions,
  ViewToken,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../../components/ui/page-header';
import api from '../../services/api';
import VideoFeedItem from '../../components/feed/VideoFeedItem';
import StoryViewer from '../../components/stories/StoryViewer';
import type { StoryUser } from '../../components/stories/StoriesRail';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_FULL_HEIGHT = Dimensions.get('screen').height;
const GRID_COLS = 2;
const GRID_GAP = 3;
const THUMB_WIDTH = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS;
const THUMB_HEIGHT = THUMB_WIDTH * 1.6;

// ─── Story Circle ────────────────────────────────────────────────
function StoryCircle({ user, onPress }: { user: StoryUser; onPress: () => void }) {
  const avatar = user.stories?.[0]?.mediaUrl ?? null;
  return (
    <TouchableOpacity style={sc.storyItem} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={['#D4AF37', '#C9A227', '#997D2D']} style={sc.storyRing}>
        <View style={sc.storyAvatarWrapper}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={sc.storyAvatar} contentFit="cover" />
          ) : (
            <View style={[sc.storyAvatar, { backgroundColor: '#1a2a50', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={20} color="#D4AF37" />
            </View>
          )}
        </View>
      </LinearGradient>
      <Text style={sc.storyName} numberOfLines={1}>
        {user.userName ?? 'مستخدم'}
      </Text>
    </TouchableOpacity>
  );
}

const sc = StyleSheet.create({
  storyItem: { alignItems: 'center', marginHorizontal: 6, width: 72 },
  storyRing: { width: 70, height: 70, borderRadius: 35, padding: 2.5 },
  storyAvatarWrapper: { flex: 1, borderRadius: 32, overflow: 'hidden', borderWidth: 2, borderColor: '#0E1830' },
  storyAvatar: { width: '100%', height: '100%' },
  storyName: { color: '#D4AF37', fontSize: 10, marginTop: 4, textAlign: 'center', maxWidth: 68 },
});

// ─── Fullscreen Reels Modal ───────────────────────────────────────
function ReelsModal({
  visible,
  videos,
  startIndex,
  isFocused,
  onClose,
}: {
  visible: boolean;
  videos: any[];
  startIndex: number;
  isFocused: boolean;
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [listHeight, setListHeight] = useState(SCREEN_HEIGHT);
  const flatRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setActiveIndex(startIndex);
      setTimeout(() => {
        flatRef.current?.scrollToIndex({ index: startIndex, animated: false });
      }, 50);
    }
  }, [visible, startIndex]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  });
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <VideoFeedItem
      video={item}
      isActive={visible && isFocused && index === activeIndex}
      height={listHeight}
    />
  ), [visible, isFocused, activeIndex, listHeight]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000', paddingTop: insets.top }}>
        <StatusBar style="light" />
        <View style={{ flex: 1 }} onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}>
          <FlatList
            ref={flatRef}
            data={videos}
            keyExtractor={(item: any) => item.id}
            renderItem={renderItem}
            pagingEnabled
            snapToInterval={listHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig.current}
            getItemLayout={(_, index) => ({
              length: listHeight,
              offset: listHeight * index,
              index,
            })}
          />
        </View>
        {/* Close button */}
        <TouchableOpacity
          style={[s.closeBtn, { top: insets.top + 10 }]}
          onPress={onClose}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Video Thumbnail Card ─────────────────────────────────────────
function VideoThumb({ item, onPress }: { item: any; onPress: () => void }) {
  const thumb = item.thumbnailUrl ?? item.thumbnail ?? null;
  return (
    <TouchableOpacity style={s.thumbCard} onPress={onPress} activeOpacity={0.85}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={s.thumbImage} contentFit="cover" />
      ) : (
        <View style={[s.thumbImage, s.thumbPlaceholder]}>
          <Ionicons name="videocam" size={28} color="#D4AF37" />
        </View>
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={s.thumbGradient} />
      <View style={s.playIcon}>
        <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
      </View>
      {item.title ? (
        <Text style={s.thumbTitle} numberOfLines={2}>{item.title}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function Feed() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => navigation.getParent()?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  const [videos, setVideos] = useState<any[]>([]);
  const [stories, setStories] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [storyInitialIndex, setStoryInitialIndex] = useState(0);
  const [reelsVisible, setReelsVisible] = useState(false);
  const [reelsStartIndex, setReelsStartIndex] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [videosRes, storiesRes] = await Promise.all([
        api.get('/admin-videos'),
        api.get('/stories/feed'),
      ]);
      const raw = videosRes.data?.data ?? videosRes.data ?? [];
      setVideos(Array.isArray(raw) ? raw : []);
      const rawStories = storiesRes.data?.data ?? storiesRes.data ?? [];
      setStories(Array.isArray(rawStories) ? rawStories : []);
    } catch (e) {
      console.error('[Feed] load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openReels = (index: number) => {
    setReelsStartIndex(index);
    setReelsVisible(true);
  };

  const StoriesRow = useCallback(() => {
    if (stories.length === 0) return null;
    return (
      <View style={s.storiesBar}>
        <FlatList
          horizontal
          data={stories}
          keyExtractor={(item: any) => item.userId ?? item.id ?? Math.random().toString()}
          contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 6 }}
          showsHorizontalScrollIndicator={false}
          style={{ direction: 'rtl' }}
          renderItem={({ item, index }) => (
            <StoryCircle
              user={item}
              onPress={() => { setStoryInitialIndex(index); setStoryViewerVisible(true); }}
            />
          )}
        />
      </View>
    );
  }, [stories]);

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      <PageHeader
        title="فيديوهات & ستوريز"
        showBack={true}
        onBack={() => router.replace('/(tabs)')}
        variant="gradient"
      />

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item: any) => item.id}
          numColumns={GRID_COLS}
          ListHeaderComponent={<StoriesRow />}
          columnWrapperStyle={s.row}
          contentContainerStyle={{ paddingHorizontal: GRID_GAP, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <VideoThumb item={item} onPress={() => openReels(index)} />
          )}
          ListEmptyComponent={() => (
            <View style={s.centered}>
              <Ionicons name="videocam-outline" size={52} color="rgba(255,255,255,0.3)" />
              <Text style={s.emptyText}>لا توجد فيديوهات حالياً</Text>
            </View>
          )}
        />
      )}

      {/* Fullscreen Reels */}
      <ReelsModal
        visible={reelsVisible}
        videos={videos}
        startIndex={reelsStartIndex}
        isFocused={isFocused}
        onClose={() => setReelsVisible(false)}
      />

      <StoryViewer
        visible={storyViewerVisible}
        storyUsers={stories}
        initialUserIndex={storyInitialIndex}
        onClose={() => setStoryViewerVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 12 },
  storiesBar: {
    backgroundColor: '#000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
    marginBottom: 6,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  thumbCard: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  thumbGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  thumbTitle: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
});

