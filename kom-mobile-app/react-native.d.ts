import 'react-native';

declare module 'react-native' {
  export interface TextInputProps {
    writingDirection?: 'rtl' | 'ltr' | 'auto';
  }
}
