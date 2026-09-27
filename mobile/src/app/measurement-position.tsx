import { router } from 'expo-router';

import {
  Button,
  Card,
  Notice,
  Page,
  PageHeading,
  Row,
  SectionTitle,
  StatusTag,
} from '@/components/ui';

export default function MeasurementPositionScreen() {
  return (
    <Page>
      <PageHeading
        eyebrow="Measurement guide"
        title="Use the same position every time"
        highlight="REPEATABLE"
        description="The exact prototype distance will be confirmed through hardware testing."
      />
      <Card>
        <StatusTag label="Working protocol" tone="warning" />
        <SectionTitle>Position</SectionTitle>
        <Row label="Reference" value="Patella" icon="locate-outline" />
        <Row label="Prototype marker" value="5 cm above" icon="resize-outline" />
        <Row label="Band direction" value="Level around leg" icon="sync-outline" />
        <Row label="Leg position" value="Seated and still" icon="body-outline" />
      </Card>
      <Notice
        title="Prototype value"
        body="The 5 cm position is a working assumption from the PRD and may change after repeatability testing."
        tone="warning"
      />
      <Button label="Close guide" onPress={() => router.back()} icon="close-circle-outline" />
    </Page>
  );
}
