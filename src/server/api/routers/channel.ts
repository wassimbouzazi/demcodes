import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { channels } from "~/server/db/schema/channel";
import { videos } from "~/server/db/schema/video";
import { changeEvents } from "~/server/db/schema/changeEvent";
import { codeOccurrences } from "~/server/db/schema/code-occurrence";
import { eq, sql } from "drizzle-orm";
import { PubSubSubscriber } from "~/server/services/pubsubhubbub/subscriber";
import { TRPCError } from "@trpc/server";

export const channelRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      channelId: z.string(),
      tag: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // First create the channel in our database
        const [channel] = await ctx.db.insert(channels)
          .values({
            name: input.name,
            channelId: input.channelId,
            tag: input.tag,
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

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: channels.id,
        name: channels.name,
        channelId: channels.channelId,
        tag: channels.tag,
        subscriptionVerified: channels.subscriptionVerified,
        videoCount: sql<number>`COUNT(DISTINCT ${videos.id})`,
        eventCount: sql<number>`COUNT(DISTINCT ${changeEvents.id})`,
        codeCount: sql<number>`COUNT(DISTINCT ${codeOccurrences.id})`
      })
      .from(channels)
      .leftJoin(videos, eq(videos.channelId, channels.channelId))
      .leftJoin(changeEvents, eq(changeEvents.channelId, channels.channelId))
      .leftJoin(codeOccurrences, eq(codeOccurrences.videoId, videos.videoId))
      .groupBy(channels.id)
      .orderBy(channels.id);
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