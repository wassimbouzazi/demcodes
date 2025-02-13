import { pgTable, serial, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  channelId: varchar("channel_id", { length: 255 }).notNull().unique(),
  subscriptionVerified: boolean("subscription_verified").default(false),
  leaseSeconds: integer("lease_seconds"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert; 