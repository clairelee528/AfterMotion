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
        <SectionTitle>1 · Prepare</SectionTitle>
        <Row label="Posture" value="Seated with leg relaxed" icon="body-outline" />
        <Row label="Skin" value="Dry before placement" icon="water-outline" />
        <Row label="After activity" value="Remove sleeve and visible sweat" icon="shirt-outline" />
      </Card>
      <Card>
        <SectionTitle>2 · Match the position</SectionTitle>
        <Row label="Reference" value="Center of patella" icon="locate-outline" />
        <Row label="Prototype marker" value="5 cm above patella" icon="resize-outline" />
        <Row label="Alignment line" value="Centered above patella" icon="reorder-three-outline" />
        <Row label="Band direction" value="Level around the leg" icon="sync-outline" />
      </Card>
      <Card>
        <SectionTitle>3 · Match the starting tension</SectionTitle>
        <Row label="Closure" value="Use the same marked position" icon="link-outline" />
        <Row label="Too loose" value="Tighten toward target" icon="remove-circle-outline" />
        <Row label="Too tight" value="Loosen toward target" icon="add-circle-outline" />
        <Row label="Ready" value="Target aligned and leg still" icon="checkmark-circle-outline" />
      </Card>
      <Card>
        <SectionTitle>4 · Switch sides consistently</SectionTitle>
        <Row label="Order" value="Left knee, then right knee" icon="swap-horizontal-outline" />
        <Row label="Position" value="Repeat the same 5 cm marker" icon="locate-outline" />
        <Row label="Tension" value="Repeat the same closure mark" icon="resize-outline" />
      </Card>
      <Notice
        title="Prototype measurement rule"
        body="Consistency matters more than pulling the band tighter. Do not save a reading until position, closure mark, and posture match the protocol."
        tone="info"
      />
      <Notice
        title="Working position"
        body="The 5 cm distance is a prototype value from the PRD and may change after repeatability testing."
        tone="warning"
      />
      <Button label="Close guide" onPress={() => router.back()} icon="close-circle-outline" />
    </Page>
  );
}
