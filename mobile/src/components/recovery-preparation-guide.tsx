import { Card, Notice, Row, SectionTitle } from './ui';

interface RecoveryPreparationGuideProps {
  checkpointLabel: string;
}

export function RecoveryPreparationGuide({
  checkpointLabel,
}: RecoveryPreparationGuideProps) {
  return (
    <Card>
      <SectionTitle>Prepare a comparable reading</SectionTitle>
      <Row label="Remove the Motion Sleeve" value="Done before measuring" icon="shirt-outline" />
      <Row label="Dry the skin and band area" value="No trapped sweat" icon="water-outline" />
      <Row label="Sit and keep the leg relaxed" value="Rest consistently" icon="body-outline" />
      <Row label="Match the marked band position" value="Use the same closure" icon="resize-outline" />
      <Notice
        title={`${checkpointLabel} checkpoint`}
        body="Use the same seated posture, band location, and starting tension as your baseline. Avoid extra activity between recovery checks."
        tone="info"
      />
    </Card>
  );
}
