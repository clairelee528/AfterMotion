import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/icons';
import { colors, radii } from '@/theme/tokens';

function TabIcon({
  focused,
  active,
  inactive,
}: {
  focused: boolean;
  active: AppIconName;
  inactive: AppIconName;
}) {
  return (
    <View style={[styles.iconContainer, focused && styles.selectedIconContainer]}>
      <AppIcon
        name={focused ? active : inactive}
        size={21}
        color={focused ? colors.highlightInk : colors.mutedInk}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.ink, fontWeight: '700' },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.mutedInk,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 78,
          paddingBottom: 9,
          paddingTop: 7,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Training',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="barbell" inactive="barbell-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="time" inactive="time-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="settings" inactive="settings-outline" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 30,
    justifyContent: 'center',
    width: 46,
  },
  selectedIconContainer: {
    backgroundColor: colors.highlight,
  },
});
