import { sql } from "drizzle-orm";
import { integer, pgTableCreator, timestamp, varchar } from "drizzle-orm/pg-core";
import { videos } from "./video";
import { channels } from "./channel";

export const createTable = pgTableCreator((name) => `demcodes_${name}`);

export const changeEvents = createTable(
  "change_event",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    videoId: varchar("video_id", { length: 256 })
      .notNull()
      .references(() => videos.videoId),
    channelId: varchar("channel_id", { length: 256 })
      .notNull()
      .references(() => channels.channelId),
    eventTimestamp: timestamp("event_timestamp", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

export type ChangeEvent = typeof changeEvents.$inferSelect;
export type InsertChangeEvent = typeof changeEvents.$inferInsert; 