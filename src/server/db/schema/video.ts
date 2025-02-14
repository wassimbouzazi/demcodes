import { sql } from "drizzle-orm";
import { boolean, integer, pgTableCreator, timestamp, varchar } from "drizzle-orm/pg-core";
import { channels } from "./channel";

export const createTable = pgTableCreator((name) => `demcodes_${name}`);

export const videos = createTable(
  "video",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    videoId: varchar("video_id", { length: 256 }).notNull().unique(),
    channelId: varchar("channel_id", { length: 256 })
      .notNull()
      .references(() => channels.channelId),
    isProcessed: boolean("is_processed").default(false).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert; 