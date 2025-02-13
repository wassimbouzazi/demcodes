import { type NextRequest } from "next/server";
import { db } from "~/server/db";
import { videos } from "~/server/db/schema/video";
import { changeEvents } from "~/server/db/schema/changeEvent";
import { channels } from "~/server/db/schema/channel";
import { eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const topic = searchParams.get("hub.topic");
  const challenge = searchParams.get("hub.challenge");
  
  if (mode === "subscribe" && topic && challenge) {
    const channelId = extractChannelId(topic);
    if (channelId) {
      // Verify subscription in database
      await db
        .update(channels)
        .set({ subscriptionVerified: true })
        .where(eq(channels.channelId, channelId));
    }
    return new Response(challenge);
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
  const match = /channel:([^:]+)/.exec(url);
  return match?.[1] ?? null;
}