import { type NextRequest } from "next/server";
import { db } from "~/server/db";
import { videos, changeEvents, channels } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { scheduleJob } from "~/server/services/scheduler/graphile";
import { processVideo } from "~/server/services/video/processor";

const parser = new XMLParser();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const topic = searchParams.get("hub.topic");
  const challenge = searchParams.get("hub.challenge");
  const leaseSeconds = searchParams.get("hub.lease_seconds");

  if (mode === "subscribe" && topic && challenge) {
    const channelId = extractChannelId(topic);
    console.log("Verifying subscription for channel:", channelId);

    if (channelId && leaseSeconds) {
      // Calculate actual expiration time based on lease seconds
      const expiresAt = new Date(
        Date.now() + parseInt(leaseSeconds) * 1000
      );

      // Update channel with verification and lease information
      await db
        .update(channels)
        .set({
          subscriptionVerified: true,
          leaseSeconds: parseInt(leaseSeconds),
          subscriptionExpiresAt: expiresAt,
        })
        .where(eq(channels.channelId, channelId));

      // Schedule renewal 5 minutes before expiration
      const renewalTime = new Date(expiresAt.getTime() - 5 * 60 * 1000);

      await scheduleJob(
        'subscription-renewal',
        { channelId },
        renewalTime
      );

      console.log(`Subscription verified for channel ${channelId}:`);
      console.log(`- Lease seconds: ${leaseSeconds}`);
      console.log(`- Expires at: ${expiresAt.toISOString()}`);
      console.log(`- Renewal scheduled for: ${renewalTime.toISOString()}`);
    }

    // Return challenge for verification
    return new Response(challenge, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Invalid request", { status: 400 });
}

interface YouTubeFeed {
  feed: {
    entry?: {
      'yt:videoId': string;
      'yt:channelId': string;
      title: string;
      published: string;
      author: {
        name: string;
        uri: string;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  console.log('Received webhook notification:', body);
  
  const feed = parser.parse(body) as YouTubeFeed;
  
  if (!feed?.feed?.entry) {
    console.log('No entry found in feed:', feed);
    return new Response("No entry found", { status: 400 });
  }
  
  const entry = feed.feed.entry;
  const videoId = entry['yt:videoId'];
  const channelId = entry['yt:channelId'];
  const channelName = entry.author.name;
  
  console.log('Parsed video data:', {
    videoId,
    channelId,
    channelName,
    title: entry.title,
    published: entry.published,
  });
  
  if (!videoId || !channelId) {
    console.log('Missing required fields:', { videoId, channelId });
    return new Response("Invalid entry data", { status: 400 });
  }
  
  try {
    // First check if video exists and is already processed
    const existingVideo = await db.query.videos.findFirst({
      where: eq(videos.videoId, videoId),
    });

    if (!existingVideo) {
      // Create new video and process it
       await db.insert(videos)
        .values({
          videoId,
          channelId,
          isProcessed: false,
        })
        .returning();
      
      // Update channel name
      await db
        .update(channels)
        .set({ name: channelName })
        .where(eq(channels.channelId, channelId));
      
      console.log(`New video ${videoId} created, processing...`);
      console.log(`Updated channel name to: ${channelName}`);
      
      const codes = await processVideo(videoId);
      console.log(`Processed codes for video ${videoId}:`, codes);
    } else {
      console.log(`Video ${videoId} already exists, skipping processing`);
    }
    
    // Create change event
    await db.insert(changeEvents)
      .values({
        videoId,
        channelId,
        eventTimestamp: new Date(),
      });
    
    console.log(`Successfully handled video ${videoId} for channel ${channelId}`);
    return new Response("OK");
  } catch (error) {
    console.error('Error processing video:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

function extractChannelId(url: string): string | null {
  // Handle feed URL format
  if (url.includes('youtube.com/xml/feeds/videos.xml')) {
    const params = new URL(url).searchParams;
    return params.get('channel_id');
  }

  // Handle other formats (like the one in POST notifications)
  const match = /channel:([^:]+)/.exec(url);
  return match?.[1] ?? null;
}