import { router } from 'expo-router';

import {
  Button,
  Card,
  Notice,
  Page,
  PageHeading,
  Row,
  SectionTitle,
} from '@/components/wireframe';

export default function MeasurementPositionScreen() {
  return (
    <Page>
      <PageHeading
        eyebrow="Measurement guide"
        title="Use the same position every time"
        description="The exact prototype distance will be confirmed through hardware testing."
      />
      <Card>
        <SectionTitle>Position</SectionTitle>
        <Row label="Reference" value="Patella" />
        <Row label="Prototype marker" value="5 cm above" />
        <Row label="Band direction" value="Level around leg" />
        <Row label="Leg position" value="Seated and still" />
      </Card>
      <Notice
        title="Prototype value"
        body="The 5 cm position is a working assumption from the PRD and may change after repeatability testing."
      />
      <Button label="Close guide" onPress={() => router.back()} />
    </Page>
  );
}
