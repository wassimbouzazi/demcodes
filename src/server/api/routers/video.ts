import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { videos } from "~/server/db/schema/video";
import { eq } from "drizzle-orm";

export const videoRouter = createTRPCRouter({
  getByChannel: publicProcedure
    .input(z.object({
      channelId: z.string(),
    }))
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(videos)
        .where(eq(videos.channelId, input.channelId));
    }),
}); 