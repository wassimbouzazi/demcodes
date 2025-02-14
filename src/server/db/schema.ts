import { pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `demcodes_${name}`);

// Import and re-export all schemas
export * from "./schema/channel";
export * from "./schema/video";
export * from "./schema/changeEvent";
export * from "./schema/code";
export * from "./schema/code-occurrence";