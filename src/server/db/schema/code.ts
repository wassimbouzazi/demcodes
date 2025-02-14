import { sql } from "drizzle-orm";
import { integer, pgTableCreator, timestamp, varchar, text, boolean } from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `demcodes_${name}`);

export const codes = createTable(
    "code",
    {
        id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
        service: varchar("service", { length: 256 }).notNull(),
        couponCode: varchar("coupon_code", { length: 256 }).notNull(),
        discount: varchar("discount", { length: 256 }).notNull(),
        url: varchar("url", { length: 512 }).notNull(),
        details: text("details").notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .$onUpdate(() => new Date()),
    }
);

export type Code = typeof codes.$inferSelect;
export type InsertCode = typeof codes.$inferInsert; 