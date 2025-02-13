import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { changeEvents } from "~/server/db/schema/changeEvent";
import { eq } from "drizzle-orm";

export const changeEventRouter = createTRPCRouter({
  getByVideo: publicProcedure
    .input(z.object({
      videoId: z.string(),
    }))
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(changeEvents)
        .where(eq(changeEvents.videoId, input.videoId));
    }),
}); 