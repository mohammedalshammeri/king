import { useEffect, useRef, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTranslation } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export type SocialAuthProviderPayload = {
  provider: 'GOOGLE' | 'APPLE';
  idToken: string;
  fullName?: string;
};

type SocialAuthSectionProps = {
  mode: 'login' | 'register';
  disabled?: boolean;
  onAuthenticate: (payload: SocialAuthProviderPayload) => Promise<void>;
};

const GOOGLE_EXPO_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const getApiErrorMessage = (error: any, fallback: string): string => {
  const rawMessage = error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message;

  if (Array.isArray(rawMessage) && rawMessage.length > 0) {
    return String(rawMessage[0]);
  }

  if (typeof rawMessage === 'string' && rawMessage.trim()) {
    return rawMessage.trim();
  }

  return fallback;
};

export default function SocialAuthSection({ mode, disabled = false, onAuthenticate }: SocialAuthSectionProps) {
  const { t } = useAppTranslation();
  const { isDark } = useTheme();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<'GOOGLE' | 'APPLE' | null>(null);
  const handledGoogleTokenRef = useRef<string | null>(null);

  const hasGoogleConfig = Boolean(
    GOOGLE_EXPO_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
  );

  const googleButtonLabel = mode === 'register'
    ? t('auth.signUpWithGoogle')
    : t('auth.continueWithGoogle');
  const appleButtonLabel = mode === 'register'
    ? t('auth.signUpWithApple')
    : t('auth.continueWithApple');

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    ...(GOOGLE_EXPO_CLIENT_ID ? { expoClientId: GOOGLE_EXPO_CLIENT_ID } : {}),
    ...(GOOGLE_ANDROID_CLIENT_ID ? { androidClientId: GOOGLE_ANDROID_CLIENT_ID } : {}),
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
    ...(GOOGLE_WEB_CLIENT_ID ? { webClientId: GOOGLE_WEB_CLIENT_ID } : {}),
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setIsAppleAvailable(false);
      return;
    }

    let mounted = true;
    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (mounted) {
          setIsAppleAvailable(available);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsAppleAvailable(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!googleResponse || googleResponse.type !== 'success') {
      return;
    }

    const idToken = googleResponse.params?.id_token || googleResponse.authentication?.idToken;
    if (!idToken || handledGoogleTokenRef.current === idToken) {
      return;
    }

    handledGoogleTokenRef.current = idToken;

    const authenticate = async () => {
      setPendingProvider('GOOGLE');
      try {
        await onAuthenticate({ provider: 'GOOGLE', idToken });
      } catch (error) {
        Alert.alert(
          t('common.error'),
          getApiErrorMessage(error, t('auth.googleAuthFailed')),
        );
      } finally {
        setPendingProvider(null);
      }
    };

    void authenticate();
  }, [googleResponse, onAuthenticate, t]);

  const handleGooglePress = async () => {
    if (!hasGoogleConfig) {
      Alert.alert(t('common.warning'), t('auth.googleNotConfigured'));
      return;
    }

    if (!googleRequest) {
      return;
    }

    setPendingProvider('GOOGLE');

    try {
      const result = await promptGoogleAsync();
      if (result.type !== 'success') {
        setPendingProvider(null);
      }
    } catch (error) {
      setPendingProvider(null);
      Alert.alert(
        t('common.error'),
        getApiErrorMessage(error, t('auth.googleAuthFailed')),
      );
    }
  };

  const handleApplePress = async () => {
    if (!isAppleAvailable) {
      Alert.alert(t('common.warning'), t('auth.appleNotAvailable'));
      return;
    }

    try {
      setPendingProvider('APPLE');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error(t('auth.socialTokenMissing'));
      }

      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim() || undefined;

      await onAuthenticate({
        provider: 'APPLE',
        idToken: credential.identityToken,
        fullName,
      });
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        return;
      }

      Alert.alert(
        t('common.error'),
        getApiErrorMessage(error, t('auth.appleAuthFailed')),
      );
    } finally {
      setPendingProvider(null);
    }
  };

  if (!hasGoogleConfig && !isAppleAvailable) {
    return null;
  }

  const googleBusy = pendingProvider === 'GOOGLE';
  const appleBusy = pendingProvider === 'APPLE';

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }]} />
        <Text style={[styles.dividerText, { color: isDark ? '#94A3B8' : '#64748B' }]}>{t('auth.orContinueWith')}</Text>
        <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }]} />
      </View>

      {hasGoogleConfig ? (
        <Pressable
          style={({ pressed }) => [
            styles.socialButton,
            {
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
              opacity: pressed ? 0.9 : 1,
            },
            (disabled || googleBusy || !googleRequest) && styles.socialButtonDisabled,
          ]}
          onPress={handleGooglePress}
          disabled={disabled || googleBusy || !googleRequest}
        >
          <View style={styles.socialButtonIconWrap}>
            {googleBusy ? (
              <ActivityIndicator size="small" color="#D4AF37" />
            ) : (
              <Ionicons name="logo-google" size={18} color="#DB4437" />
            )}
          </View>
          <Text style={[styles.socialButtonText, { color: isDark ? '#F8FAFC' : '#0A0B14' }]}>{googleButtonLabel}</Text>
        </Pressable>
      ) : null}

      {isAppleAvailable ? (
        <Pressable
          style={({ pressed }) => [
            styles.socialButton,
            {
              backgroundColor: isDark ? '#111827' : '#0A0B14',
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : '#0A0B14',
              opacity: pressed ? 0.92 : 1,
            },
            (disabled || appleBusy) && styles.socialButtonDisabled,
          ]}
          onPress={handleApplePress}
          disabled={disabled || appleBusy}
        >
          <View style={styles.socialButtonIconWrap}>
            {appleBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            )}
          </View>
          <Text style={[styles.socialButtonText, styles.appleButtonText]}>{appleButtonLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    gap: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  socialButton: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonDisabled: {
    opacity: 0.7,
  },
  socialButtonIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 10,
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
});