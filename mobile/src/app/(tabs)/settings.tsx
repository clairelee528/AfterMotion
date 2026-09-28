import { router } from 'expo-router';

import {
  Button,
  Card,
  Page,
  PageHeading,
  Row,
  SectionTitle,
  StatusTag,
} from '@/components/ui';
import { useSessionStore } from '@/state/session-store';

export default function SettingsScreen() {
  const { loadDemoFixtures } = useSessionStore();

  return (
    <Page>
      <PageHeading
        eyebrow="Settings"
        title="Measurement setup"
        highlight="CONSISTENT DATA"
        description="Defaults used when creating a new training session."
      />
      <Card>
        <SectionTitle>Profile</SectionTitle>
        <Row label="Injured side" value="Right" icon="body-outline" />
        <Row label="Default source" value="Demo data" icon="options-outline" />
      </Card>
      <Card>
        <SectionTitle>Devices</SectionTitle>
        <StatusTag label="Hardware not connected" tone="pending" />
        <Row label="Motion Sleeve" value="Not connected" icon="shirt-outline" />
        <Row label="Recovery Band" value="Not connected" icon="bluetooth-outline" />
      </Card>
      <Card>
        <SectionTitle>Measurement protocol</SectionTitle>
        <Button
          label="View band position"
          icon="locate-outline"
          onPress={() => router.push('/measurement-position')}
          variant="secondary"
        />
      </Card>
      <Card>
        <SectionTitle>Portfolio demo</SectionTitle>
        <Row
          label="Included states"
          value="Active · complete · ended early"
          icon="albums-outline"
        />
        <Button
          label="Load or reset demo sessions"
          icon="flask-outline"
          onPress={loadDemoFixtures}
          variant="secondary"
        />
      </Card>
      <Card>
        <SectionTitle>About</SectionTitle>
        <Row label="Prototype" value="Day 4" icon="construct-outline" />
        <Row label="Medical status" value="Not a diagnostic device" icon="information-circle-outline" />
      </Card>
    </Page>
  );
}
