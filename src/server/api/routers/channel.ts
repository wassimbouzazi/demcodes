import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { channels } from "~/server/db/schema/channel";
import { PubSubSubscriber } from "~/server/services/pubsubhubbub/subscriber";
import { scheduleSubscriptionRenewal } from "~/server/services/scheduler/worker";
import { eq } from "drizzle-orm";

export const channelRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      channelId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Subscribe to PubSubHubbub
      const leaseSeconds = await PubSubSubscriber.subscribe(input.channelId);
      const expiresAt = new Date(Date.now() + leaseSeconds * 1000);

      // Create channel in database
      const [channel] = await ctx.db.insert(channels).values({
        name: input.name,
        channelId: input.channelId,
        leaseSeconds,
        subscriptionExpiresAt: expiresAt,
      }).returning();

      // Schedule renewal
      await scheduleSubscriptionRenewal(input.channelId, expiresAt);

      return channel;
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.select().from(channels);
  }),

  verifySubscription: publicProcedure
    .input(z.object({
      channelId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(channels)
        .set({ subscriptionVerified: true })
        .where(eq(channels.channelId, input.channelId))
        .returning();
    }),
}); 