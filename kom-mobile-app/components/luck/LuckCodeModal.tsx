import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTranslation } from '@/context/LanguageContext';

interface LuckCodeModalProps {
  visible: boolean;
  code: string;
  onClose: () => void;
}

export default function LuckCodeModal({ visible, code, onClose }: LuckCodeModalProps) {
  const { t } = useAppTranslation();

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('luck.shareMessage', { code }),
        title: t('luck.shareTitle'),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(code);
    Alert.alert(t('luck.copiedTitle'), t('luck.copiedMessage', { code }));
  };

  // Parse code digits (format: "3-7-2")
  const digits = code.split('-');

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Confetti-like header */}
          <LinearGradient
            colors={['#0E1830', '#1a2e60']}
            style={styles.header}
          >
            <Text style={styles.headerEmoji}>🎉</Text>
            <Text style={styles.headerTitle}>{t('luck.congrats')}</Text>
            <Text style={styles.headerSubtitle}>{t('luck.receivedCode')}</Text>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.infoText}>{t('luck.infoText')}</Text>

            {/* Code Card */}
            <LinearGradient
              colors={['#D4AF37', '#C9A227', '#997D2D']}
              style={styles.codeCard}
            >
                <Text style={styles.codeLabel}>{t('luck.codeLabel')}</Text>
                <View style={styles.codeDigitsRow}>
                  {digits.map((digit, i) => (
                    <React.Fragment key={i}>
                      <View style={styles.digitBox}>
                        <Text style={styles.digitText}>{digit}</Text>
                      </View>
                      {i < digits.length - 1 && (
                        <Text style={styles.digitSeparator}>-</Text>
                      )}
                    </React.Fragment>
                  ))}
                </View>
                <Text style={styles.codeFooter}>{t('luck.brandFooter')}</Text>
              </LinearGradient>

            <Text style={styles.warningText}>{t('luck.warningText')}</Text>

            {/* Action Buttons */}
            <View style={[styles.actions, { flexDirection: 'row' }]}>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={20} color="#fff" />
                <Text style={styles.copyBtnText}>{t('luck.copyCode')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color="#D4AF37" />
                <Text style={styles.shareBtnText}>{t('common.share')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D4AF37',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  body: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  codeCard: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 12,
    minWidth: 280,
  },
  codeLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  codeDigitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  digitBox: {
    width: 60,
    height: 70,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  digitText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
  },
  digitSeparator: {
    fontSize: 28,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    marginHorizontal: 2,
  },
  codeFooter: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  warningText: {
    fontSize: 11,
    color: '#e67e22',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0E1830',
    borderRadius: 12,
    paddingVertical: 14,
  },
  copyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  shareBtnText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 13,
  },
  closeBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
});
