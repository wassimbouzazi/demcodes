import { sql } from "drizzle-orm";
import { 
  boolean, 
  integer, 
  pgTableCreator, 
  timestamp, 
  varchar 
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `demcodes_${name}`);

export const channels = createTable(
  "channel",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }).notNull(),
    channelId: varchar("channel_id", { length: 256 }).notNull().unique(),
    tag: varchar("tag", { length: 256 }),
    subscriptionVerified: boolean("subscription_verified").default(false),
    leaseSeconds: integer("lease_seconds"),
    subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  }
);

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert; 