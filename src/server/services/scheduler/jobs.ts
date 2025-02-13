import { db } from "~/server/db";
import { channels } from "~/server/db/schema";
import { PubSubSubscriber } from "../pubsubhubbub/subscriber";
import { eq } from "drizzle-orm";

export interface SubscriptionRenewalPayload {
    channelId: string;
}

export async function handleSubscriptionRenewal(payload: SubscriptionRenewalPayload) {
    const { channelId } = payload;

    console.log(`Starting subscription renewal for channel ${channelId}`);

    try {

        // Update channel to pending verification
        const [updatedChannel] = await db
            .update(channels)
            .set({
                subscriptionVerified: false, // Will be set to true when webhook verifies
                // Clear lease info until we get new values from webhook
                leaseSeconds: null,
                subscriptionExpiresAt: null,
            })
            .where(eq(channels.channelId, channelId))
            .returning();

        if (!updatedChannel) {
            throw new Error(`Channel ${channelId} not found`);
        }
        // Request subscription renewal
        await PubSubSubscriber.subscribe(channelId);
        console.log(`Renewal request sent for channel ${channelId}`);



        console.log(`Channel ${channelId} updated, awaiting verification`);

        // Note: The webhook will:
        // 1. Verify the subscription
        // 2. Set new lease seconds
        // 3. Schedule next renewal

    } catch (error) {
        console.error(`Failed to renew subscription for channel ${channelId}:`, error);
        throw error; // Rethrow to trigger Graphile Worker retry
    }
} 