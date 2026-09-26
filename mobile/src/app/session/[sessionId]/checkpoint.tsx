import { router, useLocalSearchParams } from 'expo-router';

import {
  Button,
  Card,
  Notice,
  Page,
  PageHeading,
  Row,
  SectionTitle,
} from '@/components/wireframe';
import { useSessionStore } from '@/state/session-store';

export default function CheckpointScreen() {
  const { sessionId, checkpoint = '0' } = useLocalSearchParams<{
    sessionId: string;
    checkpoint?: string;
  }>();
  const { sessions } = useSessionStore();
  const record = sessions[sessionId]?.recovery[checkpoint];
  const title = checkpoint === '0' ? 'Post-activity response' : `${checkpoint} minute response`;

  if (!record?.left || !record.right) {
    return (
      <Page>
        <PageHeading
          eyebrow="Recovery check"
          title="Measurement incomplete"
          description="Return to the Session overview to complete the missing knee measurement."
        />
        <Button
          label="Return to session overview"
          onPress={() =>
            router.replace({ pathname: '/session/[sessionId]', params: { sessionId } })
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeading
        eyebrow="Recovery check · Complete"
        title={title}
        description="Both knee measurements and your reported feelings are saved locally."
      />
      <Card>
        <SectionTitle>Left knee</SectionTitle>
        <Row label="Temperature" value={`${record.left.temperatureCelsius.toFixed(1)}°C`} />
        <Row label="Stretch reading" value={String(record.left.stretchValue)} />
        <Row label="Recorded" value={new Date(record.left.recordedAt).toLocaleTimeString()} />
      </Card>
      <Card>
        <SectionTitle>Right knee</SectionTitle>
        <Row label="Temperature" value={`${record.right.temperatureCelsius.toFixed(1)}°C`} />
        <Row label="Stretch reading" value={String(record.right.stretchValue)} />
        <Row label="Recorded" value={new Date(record.right.recordedAt).toLocaleTimeString()} />
      </Card>
      <Card>
        <SectionTitle>How your knee felt</SectionTitle>
        <Row label="Pain" value={`${record.symptoms.pain}/10`} />
        <Row label="Stiffness" value={`${record.symptoms.stiffness}/10`} />
        <Row label="Swelling" value={record.symptoms.swelling} />
        <Button
          label="Edit feelings"
          onPress={() =>
            router.push({
              pathname: '/session/[sessionId]/feelings',
              params: { sessionId, checkpoint },
            })
          }
          variant="text"
        />
      </Card>
      <Notice
        title="Measurement values are preserved"
        body="Editing feelings does not replace the temperature or stretch readings."
      />
    </Page>
  );
}
