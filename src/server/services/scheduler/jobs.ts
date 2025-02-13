import { db } from "~/server/db";
import { channels } from "~/server/db/schema/channel";
import { PubSubSubscriber } from "../pubsubhubbub/subscriber";
import { scheduleSubscriptionRenewal } from "./worker";
import { eq } from "drizzle-orm";

export async function handleSubscriptionRenewal(jobData: SubscriptionRenewalJob) {
  const { channelId } = jobData;
  
  // Renew subscription
  const leaseSeconds = await PubSubSubscriber.subscribe(channelId);
  if (!leaseSeconds) {
    throw new Error(`Failed to renew subscription for channel ${channelId}`);
  }

  const expiresAt = new Date(Date.now() + leaseSeconds * 1000);
  
  // Update channel
  const [updatedChannel] = await db
    .update(channels)
    .set({
      leaseSeconds,
      subscriptionExpiresAt: expiresAt,
      subscriptionVerified: false, // Will be verified when webhook is called
    })
    .where(eq(channels.channelId, channelId))
    .returning();

  if (!updatedChannel) {
    throw new Error(`Channel ${channelId} not found`);
  }
  
  // Schedule next renewal
  await scheduleSubscriptionRenewal(channelId, expiresAt);
} 