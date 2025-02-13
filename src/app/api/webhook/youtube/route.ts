import { type NextRequest } from "next/server";
import { db } from "~/server/db";
import { videos, changeEvents, channels } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { scheduleJob } from "~/server/services/scheduler/graphile";

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

export async function POST(request: NextRequest) {
  const body = await request.text();
  const feed = parser.parse(body) as { feed?: { entry?: unknown } };
  
  if (!feed?.feed?.entry) {
    return new Response("No entry found", { status: 400 });
  }
  
  const entry = feed.feed.entry as { id: string; "yt:channelId": string };
  const videoId = extractVideoId(entry.id);
  const channelId = extractChannelId(entry["yt:channelId"]);
  
  if (!videoId || !channelId) {
    return new Response("Invalid entry data", { status: 400 });
  }
  
  // Create or update video
  await db.insert(videos)
    .values({
      videoId,
      channelId,
    })
    .onConflictDoNothing();
  
  // Create change event
  await db.insert(changeEvents)
    .values({
      videoId,
      channelId,
      eventTimestamp: new Date(),
    });
  
  return new Response("OK");
}

function extractVideoId(url: string): string | null {
  const match = /video:([^:]+)/.exec(url);
  return match?.[1] ?? null;
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