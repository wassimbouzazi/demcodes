import { sql } from "drizzle-orm";
import { integer, pgTableCreator, timestamp, varchar } from "drizzle-orm/pg-core";
import { codes } from "./code";
import { videos } from "./video";

export const createTable = pgTableCreator((name) => `demcodes_${name}`);

export const codeOccurrences = createTable(
    "code_occurrence",
    {
        id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
        codeId: integer("code_id")
            .notNull()
            .references(() => codes.id),
        videoId: varchar("video_id", { length: 256 })
            .notNull()
            .references(() => videos.videoId),
        foundAt: timestamp("found_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    }
);