import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'خطأ' }} />
      <View style={[styles.container]}>
        <Text style={styles.title}>هذه الصفحة غير موجودة</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>العودة للرئيسية</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    width: '100%',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    width: '100%',
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
    textAlign: 'right',
  },
});
