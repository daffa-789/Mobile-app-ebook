import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as Font from 'expo-font';
import { PlusJakartaSans_400Regular, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/state/AuthContext';
import { BookProvider } from './src/state/BookContext';
import Root from './src/nav/Root';
import { ToastHost } from './src/components/Toast';
import { colors } from './src/theme';

export default function App() {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          PlusJakartaSans: PlusJakartaSans_400Regular,
          PlusJakartaSans: PlusJakartaSans_700Bold,
          PlusJakartaSans: PlusJakartaSans_800ExtraBold,
          Fraunces: Fraunces_700Bold,
          Amiri: Amiri_400Regular,
        });
      } finally {
        setFontsReady(true);
      }
    })();
  }, []);

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ui.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand[700]} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BookProvider>
          <Root />
          <ToastHost />
        </BookProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
