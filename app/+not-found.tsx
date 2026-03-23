import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function NotFound() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, []);
  return <View style={{ flex: 1, backgroundColor: '#101722' }} />;
}
