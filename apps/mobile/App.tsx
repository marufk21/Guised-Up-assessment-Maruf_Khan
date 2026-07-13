import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { FeedScreen } from './src/FeedScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <FeedScreen />
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
});
