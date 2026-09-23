import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>AFTERMOTION</Text>
        <Text style={styles.title}>Knee response, made visible.</Text>
        <Text style={styles.description}>
          The Day 1 foundation is ready. Baseline, activity load, response, and
          recovery screens will be built on this navigation and data structure.
        </Text>
        <View style={styles.flow}>
          <Text style={styles.flowText}>
            Baseline → Load → Response → Recovery
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 16,
  },
  title: {
    color: colors.ink,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.4,
    lineHeight: 44,
  },
  description: {
    color: colors.mutedInk,
    fontSize: 17,
    lineHeight: 26,
    marginTop: 20,
  },
  flow: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginTop: 32,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  flowText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
});
