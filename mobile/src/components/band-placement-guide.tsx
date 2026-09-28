import { Button, Card, Row, SectionTitle, StatusTag } from '@/components/ui';
import type { KneeSide } from '@/domain/models';

export function BandPlacementGuide({
  side,
  onOpenFullGuide,
}: {
  side: KneeSide;
  onOpenFullGuide: () => void;
}) {
  const sideLabel = side === 'left' ? 'Left knee' : 'Right knee';
  return (
    <Card variant="muted">
      <StatusTag label="Position before measuring" tone="info" />
      <SectionTitle>Apply the Recovery Band</SectionTitle>
      <Row label="Current side" value={sideLabel} icon="body-outline" />
      <Row label="Position marker" value="5 cm above patella" icon="locate-outline" />
      <Row label="Starting tension" value="Align the marked closure" icon="resize-outline" />
      <Button
        label="View full placement guide"
        icon="information-circle-outline"
        onPress={onOpenFullGuide}
        variant="secondary"
      />
    </Card>
  );
}
