import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

export function Page({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.heading}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function Progress({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[styles.progressValue, { width: `${(current / total) * 100}%` }]}
      />
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Value({ children }: { children: ReactNode }) {
  return <Text style={styles.value}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'text' && styles.textButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}>
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' && styles.primaryButtonText,
          variant !== 'primary' && styles.secondaryButtonText,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.choice, selected && styles.selectedChoice]}>
      <Text style={[styles.choiceText, selected && styles.selectedChoiceText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function Notice({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
    </View>
  );
}

export const wireframeStyles = StyleSheet.create({
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actions: {
    gap: 10,
    marginTop: 28,
  },
  muted: {
    color: colors.mutedInk,
    fontSize: 14,
    lineHeight: 21,
  },
  metric: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
  },
  divider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
});

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    gap: 18,
    padding: 24,
    paddingBottom: 48,
  },
  heading: {
    gap: 9,
    marginBottom: 4,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  description: {
    color: colors.mutedInk,
    fontSize: 16,
    lineHeight: 24,
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: 99,
    height: 5,
    overflow: 'hidden',
  },
  progressValue: {
    backgroundColor: colors.ink,
    height: 5,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 6,
  },
  label: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '600',
  },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: colors.ink,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.35,
  },
  pressedButton: {
    opacity: 0.75,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: colors.ink,
  },
  choice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedChoice: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  choiceText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedChoiceText: {
    color: '#FFFFFF',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLabel: {
    color: colors.mutedInk,
    fontSize: 15,
  },
  rowValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  notice: {
    backgroundColor: '#E8ECE9',
    borderRadius: 14,
    gap: 6,
    padding: 16,
  },
  noticeTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  noticeBody: {
    color: colors.mutedInk,
    fontSize: 14,
    lineHeight: 21,
  },
});
