import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { channels } from "./channel";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  videoId: varchar("video_id", { length: 255 }).notNull().unique(),
  channelId: varchar("channel_id", { length: 255 })
    .notNull()
    .references(() => channels.channelId),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert; 