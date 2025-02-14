import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";

// Import all schemas
import { channels } from "./schema/channel";
import { videos } from "./schema/video";
import { changeEvents } from "./schema/changeEvent";
import { codes } from "./schema/code";
import { codeOccurrences } from "./schema/code-occurrence";
// Export schemas
export const schema = {
  channels,
  videos,
  changeEvents,
  codes,
  codeOccurrences,
};

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
