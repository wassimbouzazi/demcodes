import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { channels } from "~/server/db/schema";
import { PubSubSubscriber } from "~/server/services/pubsubhubbub/subscriber";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const channelRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      channelId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // First create the channel in our database
        const [channel] = await ctx.db.insert(channels)
          .values({
            name: input.name,
            channelId: input.channelId,
            subscriptionVerified: false,
          })
          .returning();

        if (!channel) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create channel',
          });
        }

        // Then attempt to subscribe to PubSubHubbub
        try {
          await PubSubSubscriber.subscribe(input.channelId);
          console.log(`Subscription requested for channel: ${input.channelId}`);
        } catch (error) {
          console.error('Failed to subscribe to PubSubHubbub:', error);
          // We don't throw here because the channel was created successfully
          // The subscription can be retried later
        }

        return channel;
      } catch (error) {
        if (error instanceof Error && error.message.includes('unique constraint')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Channel already exists',
          });
        }
        throw error;
      }
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