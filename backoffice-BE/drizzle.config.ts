import type { Config } from "drizzle-kit";

import * as dotenv from "dotenv";
dotenv.config();

export default {
  schema: "./src/db/schema.ts", // Where Drizzle will write the schema
  out: "./drizzle", // Where migrations will live
  dialect: "mysql",
  dbCredentials: {
    host: process.env.MAIN_DB_HOST!,
    user: process.env.MAIN_DB_USER!,
    password: process.env.MAIN_DB_PASSWORD!,
    database: process.env.MAIN_DB_NAME!,
  },
  strict: false,
} satisfies Config;
