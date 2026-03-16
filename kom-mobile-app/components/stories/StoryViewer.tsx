import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StoryUser } from './StoriesRail';
import { storiesService } from '@/services/stories';
import { useAuthStore } from '@/store/authStore';

const { width, height } = Dimensions.get('window');

interface StoryViewerProps {
  visible: boolean;
  storyUsers: StoryUser[];
  initialUserIndex: number; // Keeping for fallback/compat
  initialUserId?: string;   // Adding for safety
  onClose: () => void;
}

export default function StoryViewer({ visible, storyUsers, initialUserIndex, initialUserId, onClose }: StoryViewerProps) {
  const { user } = useAuthStore();
  const safeInsets = useSafeAreaInsets();

  const [userIndex, setUserIndex] = useState(() => {
    if (initialUserId) {
        const foundIndex = storyUsers.findIndex(u => u.userId === initialUserId);
        if (foundIndex !== -1) return foundIndex;
    }
    return initialUserIndex;
  });
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Removed old videoRef, using player instead
  const progressAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let idx = initialUserIndex;
    if (initialUserId) {
      const found = storyUsers.findIndex(u => u.userId === initialUserId);
      if (found !== -1) idx = found;
    }
    setUserIndex(idx);
    setStoryIndex(0);
  }, [initialUserIndex, initialUserId, visible, storyUsers]);

  const safeCurrentUser = storyUsers[userIndex] || storyUsers[initialUserIndex];
  const safeCurrentStory = safeCurrentUser?.stories?.[storyIndex];

  // Video Player Setup
  const videoSource = safeCurrentStory?.mediaType === 'VIDEO' ? safeCurrentStory.mediaUrl : null;
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
  });

  const shouldPlayVideo = !loading && visible && !commentsVisible;

  useEffect(() => {
    if (safeCurrentStory?.mediaType === 'VIDEO') {
        if (shouldPlayVideo) {
            player.play();
        } else {
            player.pause();
        }
    }
  }, [shouldPlayVideo, player, safeCurrentStory]);

  useEffect(() => {
    const statusSubscription = player.addListener('statusChange', (status) => {
        if (status.status === 'readyToPlay') {
            setLoading(false);
        }
    });
    
    const timeUpdateSubscription = player.addListener('timeUpdate', (event) => {
        if (player.duration > 0) {
            const p = event.currentTime / player.duration;
            setProgress(p);
        }
    });

    const playToEndSubscription = player.addListener('playToEnd', () => {
        handleNext();
    });

    return () => {
        statusSubscription.remove();
        timeUpdateSubscription.remove();
        playToEndSubscription.remove();
    };
  }, [player]);

  useEffect(() => {
    if (!safeCurrentStory) return;

    setLoading(true);
    setProgress(0);

    if (progressAnimRef.current) {
      clearInterval(progressAnimRef.current);
    }

    setIsLiked(!!safeCurrentStory.isLiked);
    setLikesCount(safeCurrentStory.likesCount ?? 0);
    setCommentsCount(safeCurrentStory.commentsCount ?? 0);
    setViewsCount(safeCurrentStory.viewsCount ?? 0);

    storiesService.viewStory(safeCurrentStory.id).catch(() => undefined);
  }, [safeCurrentStory?.id]);


  const handleNext = () => {
    const currentUser = storyUsers[userIndex] || storyUsers[initialUserIndex];
    if (!currentUser) return onClose();

    if (storyIndex < (currentUser.stories?.length || 0) - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (userIndex < storyUsers.length - 1) {
      setUserIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (userIndex > 0) {
      const prevUserIndex = userIndex - 1;
      const prevUser = storyUsers[prevUserIndex];
      setUserIndex(prevUserIndex);
      setStoryIndex((prevUser?.stories?.length || 1) - 1);
    } else {
      onClose();
    }
  };

  const handlePress = (evt: any) => {
    if (commentsVisible) {
      closeComments();
      return;
    }

    const x = evt.nativeEvent.locationX;
    // في RTL: اليمين المرئي = x منخفض (جانب فيزيائي أيسر)
    // النقر على اليمين المرئي = التالي، النقر على اليسار المرئي = السابق
    const isPrevTap = I18nManager.isRTL ? x > width * 0.7 : x < width * 0.3;
    if (isPrevTap) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const onImageLoad = () => {
    setLoading(false);
    startProgress(safeCurrentStory?.duration ?? 5);
  };

  const startProgress = (durationSeconds: number) => {
    const startTime = Date.now();
    lastTimeRef.current = startTime;

    if (progressAnimRef.current) {
      clearInterval(progressAnimRef.current);
    }

    progressAnimRef.current = setInterval(() => {
      if (pausedRef.current || commentsVisible) return;

      const now = Date.now();
      const elapsed = now - startTime;
      const p = elapsed / (durationSeconds * 1000);

      if (p >= 1) {
        if (progressAnimRef.current) {
          clearInterval(progressAnimRef.current);
        }
        handleNext();
      } else {
        setProgress(p);
      }
    }, 50);
  };

  useEffect(() => {
    return () => {
      if (progressAnimRef.current) {
        clearInterval(progressAnimRef.current);
      }
    };
  }, []);

  const toggleLike = async () => {
    if (!safeCurrentStory) return;

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await storiesService.likeStory(safeCurrentStory.id);
    } catch (error) {
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      console.log('Like story error', error);
    }
  };

  const openComments = async () => {
    if (!safeCurrentStory) return;
    setCommentsVisible(true);
    setLoadingComments(true);

    try {
      const res = await storiesService.getComments(safeCurrentStory.id);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setCommentsList(data);
    } catch (error) {
      console.log('Get comments error', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const closeComments = () => setCommentsVisible(false);

  const submitComment = async () => {
    if (!safeCurrentStory) return;
    const text = newComment.trim();
    if (!text) return;

    try {
      const res = await storiesService.addComment(safeCurrentStory.id, text);
      const addedComment = res.data?.data || res.data;
      if (addedComment) {
        setCommentsList((prev) => [addedComment, ...prev]);
        setCommentsCount((prev) => prev + 1);
        setNewComment('');
      }
    } catch (error) {
      console.log('Add comment error', error);
    }
  };

  // Removed onPlaybackStatusUpdate

  // Removed shouldPlayVideo here, defined above
  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={styles.container}>
        {!safeCurrentStory ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : (
          <>
            {safeCurrentStory.mediaType === 'VIDEO' ? (
              <VideoView
                player={player}
                style={styles.media}
                contentFit="cover"
              />
            ) : (
              <Image source={{ uri: safeCurrentStory.mediaUrl }} style={styles.media} contentFit="cover" onLoad={onImageLoad} />
            )}

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={26} color="white" />
            </TouchableOpacity>

            <TouchableWithoutFeedback onPress={handlePress}>
              <View style={styles.touchOverlay} />
            </TouchableWithoutFeedback>

            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            <View style={[styles.uiOverlay, { paddingTop: safeInsets.top || (Platform.OS === 'android' ? 28 : 44) }]} pointerEvents="box-none">
              <View style={styles.progressBarContainer}>
                {safeCurrentUser.stories.map((story, index) => (
                  <View key={story.id} style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width:
                            index === storyIndex
                              ? `${progress * 100}%`
                              : index < storyIndex
                              ? '100%'
                              : '0%',
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={
                      safeCurrentUser.role === 'ADMIN' ||
                      safeCurrentUser.role === 'SUPER_ADMIN' ||
                      safeCurrentUser.userName?.toLowerCase().includes('admin')
                        ? require('../../assets/images/logo.png')
                        : { uri: safeCurrentUser.userAvatar || undefined }
                    }
                    style={[
                      styles.avatar,
                      (safeCurrentUser.role === 'ADMIN' ||
                        safeCurrentUser.role === 'SUPER_ADMIN' ||
                        safeCurrentUser.userName?.toLowerCase().includes('admin')) && { backgroundColor: '#fff', padding: 2 },
                    ]}
                    contentFit="cover"
                  />
                  <Text style={styles.username} numberOfLines={1}>
                    {safeCurrentUser.userName}
                  </Text>
                </View>
              </View>

              <View style={styles.socialContainer}>
                <View style={styles.socialItem}>
                  <Ionicons name="eye" size={28} color="white" />
                  <Text style={styles.socialText}>{viewsCount}</Text>
                </View>

                <View style={{ height: 20 }} />

                <TouchableOpacity
                  style={styles.socialItem}
                  onPress={toggleLike}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={30} color={isLiked ? '#ef4444' : 'white'} />
                  <Text style={styles.socialText}>{likesCount}</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />

                <TouchableOpacity
                  style={styles.socialItem}
                  onPress={openComments}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Ionicons name="chatbubble-outline" size={28} color="white" />
                  <Text style={styles.socialText}>{commentsCount}</Text>
                </TouchableOpacity>

                {safeCurrentUser.userId === user?.id && (
                  <>
                    <View style={{ height: 20 }} />
                    <TouchableOpacity
                      style={styles.socialItem}
                      onPress={() => {
                        storiesService.deleteStory(safeCurrentStory.id).then(() => {
                          handleNext();
                        });
                      }}
                    >
                      <Ionicons name="trash-outline" size={24} color="white" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </>
        )}

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}

        <Modal visible={commentsVisible} animationType="slide" transparent onRequestClose={closeComments}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeComments}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContentWrapper}
            >
              <TouchableOpacity activeOpacity={1} style={[styles.commentsContainer, { backgroundColor: '#1e1e1e' }]}>
                <View style={styles.dragHandle} />
                <Text style={styles.commentsTitle}>التعليقات</Text>

                {loadingComments ? (
                  <ActivityIndicator style={{ marginTop: 20 }} color="#fff" />
                ) : (
                  <FlatList
                    data={commentsList}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={
                      <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
                        لا توجد تعليقات بعد. كن أول من يعلق!
                      </Text>
                    }
                    renderItem={({ item }) => (
                      <View style={styles.commentItem}>
                        <Image
                          source={
                            item.userName?.toLowerCase().includes('admin')
                              ? require('../../assets/images/logo.png')
                              : { uri: item.userAvatar }
                          }
                          style={[
                            styles.commentAvatar,
                            item.userName?.toLowerCase().includes('admin') && { backgroundColor: '#fff', padding: 2 },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.commentUser}>{item.userName || 'مستخدم'}</Text>
                          <Text style={styles.commentText}>{item.text}</Text>
                        </View>
                      </View>
                    )}
                  />
                )}

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="أضف تعليقاً..."
                    placeholderTextColor="#999"
                    value={newComment}
                    onChangeText={setNewComment}
                  />
                  <TouchableOpacity style={styles.sendButton} onPress={submitComment}>
                    <Ionicons name="send" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  media: {
    width: width,
    height: height,
    position: 'absolute',
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1, // Ensure it is below UI
  },
  uiOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 10,
    justifyContent: 'space-between',
    zIndex: 1000, // Ensure it is above touch overlay
    elevation: 10, // Higher elevation for Android
  },
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 4,
    height: 3,
    marginBottom: 10,
    marginTop: 0,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 999,
    elevation: 5,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'white',
    marginRight: 10,
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 16 : 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    elevation: 6,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  // Social Styles
  socialContainer: {
      position: 'absolute',
      right: 16,
      bottom: 60,
      alignItems: 'center',
      zIndex: 999,
      elevation: 5, // Important for Android
  },
  socialItem: {
      alignItems: 'center',
  },
  socialText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10
  },
  // Comments Modal
  modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContentWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
  },
  commentsContainer: {
      height: '60%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 10
  },
  dragHandle: {
      width: 40,
      height: 4,
      backgroundColor: '#555',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 10
  },
  commentsTitle: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
      paddingBottom: 10
  },
  commentItem: {
      flexDirection: 'row',
      marginBottom: 16,
  },
  commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginLeft: 10,
      backgroundColor: '#333'
  },
  commentUser: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 2,
      textAlign: 'right'
  },
  commentText: {
      color: '#ddd',
      fontSize: 13,
      textAlign: 'right'
  },
  inputContainer: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: '#333',
      alignItems: 'center',
      paddingBottom: Platform.OS === 'ios' ? 30 : 12
  },
  commentInput: {
      flex: 1,
      backgroundColor: '#333',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      color: '#fff',
      textAlign: 'right',
      marginRight: 10
  },
  sendButton: {
      padding: 8
  }
});

