import { env } from "~/env";

export class PubSubSubscriber {
  private static readonly HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe';
  
  static async subscribe(channelId: string): Promise<number> {
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
    const callbackUrl = `${env.APP_URL}/api/webhook/youtube`;
    
    const response = await fetch(this.HUB_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.topic': topicUrl,
        'hub.callback': callbackUrl,
        'hub.verify': 'sync',
      }),
    });

    // Extract lease seconds from response headers if available
    const leaseSeconds = parseInt(response.headers.get('hub.lease_seconds') ?? '0');
    return leaseSeconds;
  }
} 