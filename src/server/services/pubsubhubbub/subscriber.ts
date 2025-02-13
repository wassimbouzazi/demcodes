import { env } from "~/env";

export class PubSubSubscriber {
  private static readonly HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe';
  
  static async subscribe(channelId: string): Promise<void> {
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
    const callbackUrl = `${env.APP_URL}/api/webhook/youtube`;

    console.log("Requesting subscription...");
    console.log("Topic URL:", topicUrl);
    console.log("Callback URL:", callbackUrl);
    
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

    if (!response.ok) {
      throw new Error(`Failed to subscribe: ${response.status} ${response.statusText}`);
    }

    console.log("Subscription request sent successfully");
  }
} 