import { PostHog } from 'posthog-node';

const client = new PostHog(process.env.POSTHOG_KEY || '', {
  host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
});

export function captureEvent(event: string, properties?: Record<string, any>) {
  try {
    client.capture({
      distinctId: 'axis-server-pipeline',
      event,
      properties,
    });
  } catch (error) {
    console.error('PostHog capture error:', error);
  }
}

export async function shutdownPostHog() {
  await client.shutdown();
}
