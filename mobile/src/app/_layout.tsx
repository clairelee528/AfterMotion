import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text } from 'react-native';

import { colors } from '@/theme/tokens';
import { SessionStoreProvider } from '@/state/session-store';

export default function RootLayout() {
  return (
    <SessionStoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.ink,
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/')}>
              <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600' }}>
                Home
              </Text>
            </Pressable>
          ),
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="session/new" options={{ title: 'New session' }} />
        <Stack.Screen
          name="session/[sessionId]/index"
          options={{ title: 'Session overview' }}
        />
        <Stack.Screen
          name="session/[sessionId]/feelings"
          options={{ title: 'Edit feelings' }}
        />
        <Stack.Screen
          name="session/[sessionId]/checkpoint"
          options={{ title: 'Recovery check' }}
        />
        <Stack.Screen
          name="session/[sessionId]/measurement"
          options={{ title: 'Measurement' }}
        />
        <Stack.Screen
          name="session/[sessionId]/sleeve-setup"
          options={{ title: 'Motion Sleeve' }}
        />
        <Stack.Screen
          name="session/[sessionId]/activity"
          options={{ title: 'Activity', headerBackVisible: false }}
        />
        <Stack.Screen
          name="session/[sessionId]/activity-summary"
          options={{ title: 'Activity complete' }}
        />
        <Stack.Screen
          name="session/[sessionId]/summary"
          options={{ title: 'Session summary' }}
        />
        <Stack.Screen
          name="measurement-position"
          options={{ presentation: 'modal', title: 'Band position' }}
        />
      </Stack>
    </SessionStoreProvider>
  );
}
