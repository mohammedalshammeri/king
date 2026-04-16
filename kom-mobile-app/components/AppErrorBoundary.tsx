import { Component, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import i18n from '@/lib/i18n';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  private handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Failed to reload app after crash:', error);
      this.setState({ hasError: false });
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>{i18n.t('errorBoundary.title')}</Text>
        <Text style={styles.description}>{i18n.t('errorBoundary.description')}</Text>

        <Pressable onPress={this.handleRetry} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{i18n.t('errorBoundary.retry')}</Text>
        </Pressable>

        <Pressable onPress={this.handleReload} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{i18n.t('errorBoundary.reload')}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryButtonText: {
    color: '#0f172a',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
