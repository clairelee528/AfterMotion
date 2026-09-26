import { router } from 'expo-router';

import {
  Button,
  Card,
  Page,
  PageHeading,
  Row,
  SectionTitle,
} from '@/components/wireframe';

export default function SettingsScreen() {
  return (
    <Page>
      <PageHeading
        eyebrow="Settings"
        title="Measurement setup"
        description="Defaults used when creating a new training session."
      />
      <Card>
        <SectionTitle>Profile</SectionTitle>
        <Row label="Injured side" value="Right" />
        <Row label="Default source" value="Demo data" />
      </Card>
      <Card>
        <SectionTitle>Devices</SectionTitle>
        <Row label="Motion Sleeve" value="Not connected" />
        <Row label="Recovery Band" value="Not connected" />
      </Card>
      <Card>
        <SectionTitle>Measurement protocol</SectionTitle>
        <Button
          label="View band position"
          onPress={() => router.push('/measurement-position')}
          variant="secondary"
        />
      </Card>
      <Card>
        <SectionTitle>About</SectionTitle>
        <Row label="Prototype" value="Day 2" />
        <Row label="Medical status" value="Not a diagnostic device" />
      </Card>
    </Page>
  );
}
