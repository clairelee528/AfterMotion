import { router } from 'expo-router';

import {
  Button,
  Card,
  Label,
  Notice,
  Page,
  PageHeading,
  Progress,
  Row,
  SectionTitle,
  Value,
} from '@/components/wireframe';

export default function SessionSummaryScreen() {
  return (
    <Page>
      <Progress current={6} total={6} />
      <PageHeading
        eyebrow="Session summary"
        title="Your knee returned toward baseline in 48 minutes"
        description="Frisbee · Demo session"
      />
      <Card>
        <Label>What you did</Label>
        <Value>Activity Load 82 · High</Value>
        <Row label="Duration" value="68 min" />
        <Row label="Decelerations" value="18" />
      </Card>
      <Card>
        <SectionTitle>How each knee responded</SectionTitle>
        <Row label="Right circumference" value="+1.5%" />
        <Row label="Left circumference" value="+0.4%" />
        <Row label="Right temperature" value="+0.7°C" />
        <Row label="Left temperature" value="+0.3°C" />
        <Row label="Pain" value="2/10" />
      </Card>
      <Card>
        <Label>Recovery</Label>
        <Value>48 min</Value>
        <Row label="Tracking window" value="0–60 min" />
      </Card>
      <Notice
        title="Personal baseline not available yet"
        body="Complete more sessions to see your typical response and compare similar activity loads."
      />
      <Notice
        title="Not a medical diagnosis"
        body="AfterMotion describes activity load and personal response trends. Clinical decisions remain with your care team."
      />
      <Button label="Return to Training" onPress={() => router.dismissTo('/')} />
    </Page>
  );
}
