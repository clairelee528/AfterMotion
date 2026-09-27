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

import {
  colors,
  radii,
  shadows,
  sizes,
  spacing,
  typography,
} from '@/theme/tokens';
import { ActivityIcon, AppIcon, type AppIconName } from '@/components/icons';
import type { ActivityType } from '@/domain/models';

export type ButtonVariant = 'primary' | 'highlight' | 'secondary' | 'text' | 'danger';
export type StatusTone = 'active' | 'complete' | 'pending' | 'warning' | 'error' | 'info';

export function Page({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.page}>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  highlight,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  highlight?: string;
}) {
  return (
    <View style={styles.heading}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {highlight ? (
        <View style={styles.headingHighlight}>
          <Text style={styles.headingHighlightText}>{highlight}</Text>
        </View>
      ) : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function Progress({ current, total }: { current: number; total: number }) {
  const percentage = Math.max(0, Math.min(100, (current / total) * 100));
  return (
    <View accessibilityRole="progressbar" style={styles.progressTrack}>
      <View style={[styles.progressValue, { width: `${percentage}%` }]} />
    </View>
  );
}

export function MeasurementProgress({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <View style={styles.measurementProgress}>
      <View style={styles.measurementProgressHeader}>
        <Text style={styles.measurementProgressLabel}>{label}</Text>
        <Text style={styles.measurementProgressDetail}>{detail}</Text>
      </View>
      <Progress current={value} total={100} />
    </View>
  );
}

export function Card({
  children,
  style,
  variant = 'default',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'muted' | 'hero' | 'data';
}) {
  return (
    <View
      style={[
        styles.card,
        variant === 'muted' && styles.mutedCard,
        variant === 'hero' && styles.heroCard,
        variant === 'data' && styles.dataCard,
        style,
      ]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children, inverse = false }: { children: ReactNode; inverse?: boolean }) {
  return <Text style={[styles.sectionTitle, inverse && styles.inverseText]}>{children}</Text>;
}

export function Label({ children, inverse = false }: { children: ReactNode; inverse?: boolean }) {
  return <Text style={[styles.label, inverse && styles.inverseMutedText]}>{children}</Text>;
}

export function Value({ children, inverse = false }: { children: ReactNode; inverse?: boolean }) {
  return <Text style={[styles.value, inverse && styles.inverseText]}>{children}</Text>;
}

export function MetricValue({ children, inverse = false }: { children: ReactNode; inverse?: boolean }) {
  return <Text style={[styles.metricValue, inverse && styles.inverseText]}>{children}</Text>;
}

export function MetricTile({
  label,
  value,
  unit,
  highlighted = false,
}: {
  label: string;
  value: string;
  unit?: string;
  highlighted?: boolean;
}) {
  return (
    <View style={[styles.metricTile, highlighted && styles.highlightMetricTile]}>
      <Text style={styles.metricTileLabel}>{label}</Text>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricTileValue}>{value}</Text>
        {unit ? <Text style={styles.metricTileUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: AppIconName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'highlight' && styles.highlightButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'text' && styles.textButton,
        variant === 'danger' && styles.dangerButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
        style,
      ]}>
      <View style={styles.buttonContent}>
        {icon ? (
          <AppIcon
            name={icon}
            size={19}
            color={
              variant === 'primary'
                ? colors.inverseInk
                : variant === 'danger'
                  ? colors.critical
                  : colors.ink
            }
          />
        ) : null}
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.primaryButtonText,
            variant === 'highlight' && styles.highlightButtonText,
            variant === 'danger' && styles.dangerButtonText,
            (variant === 'secondary' || variant === 'text') && styles.secondaryButtonText,
          ]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function Choice({
  label,
  selected,
  onPress,
  leading,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  leading?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.selectedChoice,
        pressed && styles.pressedButton,
      ]}>
      <View style={styles.choiceContent}>
        {leading}
        <Text style={[styles.choiceText, selected && styles.selectedChoiceText]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function Row({
  label,
  value,
  inverse = false,
  icon,
}: {
  label: string;
  value: string;
  inverse?: boolean;
  icon?: AppIconName;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelGroup}>
        {icon ? (
          <AppIcon name={icon} size={18} color={inverse ? '#BFE1E5' : colors.accent} />
        ) : null}
        <Text style={[styles.rowLabel, inverse && styles.inverseMutedText]}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, inverse && styles.inverseText]}>{value}</Text>
    </View>
  );
}

export function StatusTag({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <View style={[styles.statusTag, statusToneStyles[tone].background]}>
      <View style={[styles.statusDot, statusToneStyles[tone].dot]} />
      <Text style={[styles.statusText, statusToneStyles[tone].text]}>{label}</Text>
    </View>
  );
}

export function SideBadge({ side, injured = false }: { side: 'left' | 'right'; injured?: boolean }) {
  const isLeft = side === 'left';
  return (
    <View style={[styles.sideBadge, isLeft ? styles.leftSideBadge : styles.rightSideBadge]}>
      <Text style={[styles.sideBadgeText, isLeft ? styles.leftSideText : styles.rightSideText]}>
        {isLeft ? 'L · Left' : 'R · Right'}{injured ? ' · Injured side' : ''}
      </Text>
    </View>
  );
}

export function ActivityBadge({ activity, label }: { activity: ActivityType; label: string }) {
  return (
    <View style={styles.activityBadge}>
      <ActivityIcon activity={activity} size={20} color={colors.accentStrong} />
      <Text style={styles.activityBadgeText}>{label}</Text>
    </View>
  );
}

export function Notice({
  title,
  body,
  tone = 'info',
}: {
  title: string;
  body: string;
  tone?: 'info' | 'warning' | 'error' | 'success';
}) {
  return (
    <View style={[styles.notice, noticeToneStyles[tone]]}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
    </View>
  );
}

export function StageCard({
  number,
  title,
  status,
  tone,
  children,
}: {
  number: number;
  title: string;
  status: string;
  tone: StatusTone;
  children?: ReactNode;
}) {
  return (
    <Card>
      <View style={styles.stageHeader}>
        <View style={styles.stageNumber}>
          <Text style={styles.stageNumberText}>{number}</Text>
        </View>
        <View style={styles.stageTitleGroup}>
          <Text style={styles.stageTitle}>{title}</Text>
          <StatusTag label={status} tone={tone} />
        </View>
      </View>
      {children}
    </Card>
  );
}

export function TimelineItem({
  label,
  status,
  tone,
  onPress,
  disabled = false,
}: {
  label: string;
  status: string;
  tone: StatusTone;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.timelineItem,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}>
      <View style={[styles.timelineNode, statusToneStyles[tone].dot]} />
      <Text style={styles.timelineLabel}>{label}</Text>
      <StatusTag label={status} tone={tone} />
    </Pressable>
  );
}

export const wireframeStyles = StyleSheet.create({
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 2 },
  actions: { gap: spacing.md, marginTop: spacing.xl },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  actionButton: { flex: 1, paddingHorizontal: spacing.sm },
  muted: { color: colors.mutedInk, ...typography.caption },
  metric: { color: colors.ink, ...typography.metric, letterSpacing: -1.4 },
  divider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginVertical: spacing.lg },
});

const statusToneStyles = {
  active: StyleSheet.create({
    background: { backgroundColor: colors.highlight },
    dot: { backgroundColor: colors.ink },
    text: { color: colors.highlightInk },
  }),
  complete: StyleSheet.create({
    background: { backgroundColor: colors.successSoft },
    dot: { backgroundColor: colors.success },
    text: { color: colors.success },
  }),
  pending: StyleSheet.create({
    background: { backgroundColor: colors.surfaceMuted },
    dot: { backgroundColor: colors.subtleInk },
    text: { color: colors.mutedInk },
  }),
  warning: StyleSheet.create({
    background: { backgroundColor: colors.warningSoft },
    dot: { backgroundColor: colors.warning },
    text: { color: colors.warning },
  }),
  error: StyleSheet.create({
    background: { backgroundColor: colors.criticalSoft },
    dot: { backgroundColor: colors.critical },
    text: { color: colors.critical },
  }),
  info: StyleSheet.create({
    background: { backgroundColor: colors.infoSoft },
    dot: { backgroundColor: colors.info },
    text: { color: colors.info },
  }),
} as const;

const noticeToneStyles = StyleSheet.create({
  info: { backgroundColor: colors.infoSoft, borderColor: '#C9DEEE' },
  warning: { backgroundColor: colors.warningSoft, borderColor: '#EED4AF' },
  error: { backgroundColor: colors.criticalSoft, borderColor: '#EBC7C3' },
  success: { backgroundColor: colors.successSoft, borderColor: '#C5E4D3' },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  pageContent: { gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl },
  heading: { alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  eyebrow: { color: colors.accent, textTransform: 'uppercase', ...typography.overline },
  title: { color: colors.ink, letterSpacing: -1.1, ...typography.title },
  headingHighlight: { backgroundColor: colors.highlight, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  headingHighlightText: { color: colors.highlightInk, ...typography.heading },
  description: { color: colors.mutedInk, ...typography.body },
  progressTrack: { backgroundColor: colors.surfaceStrong, borderRadius: radii.pill, height: 7, overflow: 'hidden' },
  progressValue: { backgroundColor: colors.highlight, borderRadius: radii.pill, height: 7 },
  measurementProgress: { gap: spacing.sm },
  measurementProgressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  measurementProgressLabel: { color: colors.ink, ...typography.caption },
  measurementProgressDetail: { color: colors.mutedInk, ...typography.caption },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg, ...shadows.card },
  mutedCard: { backgroundColor: colors.surfaceMuted, shadowOpacity: 0 },
  heroCard: { borderRadius: radii.xl, padding: spacing.xl },
  dataCard: { backgroundColor: colors.dataPanel, borderColor: colors.dataPanel, ...shadows.floating },
  sectionTitle: { color: colors.ink, ...typography.subheading },
  label: { color: colors.mutedInk, textTransform: 'uppercase', ...typography.overline },
  value: { color: colors.ink, ...typography.heading },
  metricValue: { color: colors.ink, letterSpacing: -1.4, ...typography.metric },
  inverseText: { color: colors.inverseInk },
  inverseMutedText: { color: '#BFE1E5' },
  metricTile: { backgroundColor: colors.surfaceMuted, borderRadius: radii.md, gap: spacing.xs, minWidth: 132, padding: spacing.lg },
  highlightMetricTile: { backgroundColor: colors.highlight },
  metricTileLabel: { color: colors.mutedInk, ...typography.caption },
  metricValueRow: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.xs },
  metricTileValue: { color: colors.ink, ...typography.metric },
  metricTileUnit: { color: colors.mutedInk, ...typography.caption },
  button: { alignItems: 'center', borderRadius: radii.md, justifyContent: 'center', minHeight: sizes.buttonHeight, paddingHorizontal: spacing.lg },
  buttonContent: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  primaryButton: { backgroundColor: colors.ink },
  highlightButton: { backgroundColor: colors.highlight },
  secondaryButton: { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderWidth: 1 },
  textButton: { backgroundColor: 'transparent', minHeight: sizes.touchTarget },
  dangerButton: { backgroundColor: colors.criticalSoft, borderColor: '#EBC7C3', borderWidth: 1 },
  disabledButton: { opacity: 0.35 },
  pressedButton: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  buttonText: { ...typography.bodyStrong },
  primaryButtonText: { color: colors.inverseInk },
  highlightButtonText: { color: colors.highlightInk },
  secondaryButtonText: { color: colors.ink },
  dangerButtonText: { color: colors.critical },
  choice: { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  choiceContent: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  selectedChoice: { backgroundColor: colors.highlight, borderColor: colors.highlightPressed },
  choiceText: { color: colors.ink, ...typography.caption },
  selectedChoiceText: { color: colors.highlightInk, fontWeight: '700' },
  row: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', minHeight: sizes.touchTarget, paddingVertical: spacing.sm },
  rowLabelGroup: { alignItems: 'center', flexDirection: 'row', flexShrink: 0, gap: spacing.sm, maxWidth: '44%' },
  rowLabel: { color: colors.mutedInk, flexShrink: 1, ...typography.body },
  rowValue: { color: colors.ink, flex: 1, minWidth: 0, textAlign: 'right', ...typography.bodyStrong },
  statusTag: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 7 },
  statusDot: { borderRadius: radii.pill, height: 7, width: 7 },
  statusText: { ...typography.caption, fontWeight: '700' },
  sideBadge: { alignSelf: 'flex-start', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  leftSideBadge: { backgroundColor: colors.leftSideSoft },
  rightSideBadge: { backgroundColor: colors.rightSideSoft },
  sideBadgeText: { ...typography.caption, fontWeight: '700' },
  leftSideText: { color: colors.leftSide },
  rightSideText: { color: colors.rightSide },
  activityBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.accentSoft, borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  activityBadgeText: { color: colors.accentStrong, ...typography.bodyStrong },
  notice: { borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.lg },
  noticeTitle: { color: colors.ink, ...typography.bodyStrong },
  noticeBody: { color: colors.mutedInk, ...typography.caption },
  stageHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  stageNumber: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.pill, height: 34, justifyContent: 'center', width: 34 },
  stageNumberText: { color: colors.inverseInk, ...typography.bodyStrong },
  stageTitleGroup: { flex: 1, gap: spacing.sm },
  stageTitle: { color: colors.ink, ...typography.heading },
  timelineItem: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, minHeight: 58, padding: spacing.md },
  timelineNode: { borderRadius: radii.pill, height: 12, width: 12 },
  timelineLabel: { color: colors.ink, flex: 1, ...typography.bodyStrong },
});
