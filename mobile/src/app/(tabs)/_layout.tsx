import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '@/theme/tokens';

const icons = {
  training: '●',
  history: '◫',
  settings: '○',
} as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.ink, fontWeight: '700' },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.mutedInk,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Training',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 17 }}>{icons.training}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 17 }}>{icons.history}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 17 }}>{icons.settings}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
