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

export default function HistoryScreen() {
  return (
    <Page>
      <PageHeading
        eyebrow="History"
        title="Your recovery over time"
        description="Compare your knee response under similar activity loads."
      />
      <Notice
        title="Personal baseline in progress"
        body="Complete more sessions to build your typical response and recovery range."
      />
      <Card>
        <SectionTitle>Frisbee · Demo session</SectionTitle>
        <Row label="Activity load" value="82 · High" />
        <Row label="Right response" value="+1.5%" />
        <Row label="Recovery time" value="48 min" />
        <Button
          label="Open session"
          onPress={() => router.push('/session/demo-previous/summary')}
          variant="secondary"
        />
      </Card>
      <Card>
        <SectionTitle>Running · Demo session</SectionTitle>
        <Row label="Activity load" value="54 · Moderate" />
        <Row label="Right response" value="+0.8%" />
        <Row label="Recovery time" value="31 min" />
      </Card>
    </Page>
  );
}
