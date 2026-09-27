import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { ActivityType } from '@/domain/models';
import { colors } from '@/theme/tokens';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];

export function AppIcon({
  name,
  size = 20,
  color = colors.ink,
}: {
  name: AppIconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

const activityIcons: Record<
  ActivityType,
  ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
  frisbee: 'disc',
  badminton: 'badminton',
  tennis: 'tennis',
  running: 'run-fast',
  gym: 'dumbbell',
  other: 'dots-horizontal-circle-outline',
};

export function ActivityIcon({
  activity,
  size = 22,
  color = colors.ink,
}: {
  activity: ActivityType;
  size?: number;
  color?: string;
}) {
  return <MaterialCommunityIcons name={activityIcons[activity]} size={size} color={color} />;
}
