import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { videos } from "./video";
import { channels } from "./channel";

export const changeEvents = pgTable("change_events", {
  id: serial("id").primaryKey(),
  videoId: varchar("video_id", { length: 255 })
    .notNull()
    .references(() => videos.videoId),
  channelId: varchar("channel_id", { length: 255 })
    .notNull()
    .references(() => channels.channelId),
  eventTimestamp: timestamp("event_timestamp").defaultNow(),
});

export type ChangeEvent = typeof changeEvents.$inferSelect;
export type InsertChangeEvent = typeof changeEvents.$inferInsert; 