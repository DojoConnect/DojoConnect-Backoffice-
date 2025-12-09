import AppConfig from './src/config/AppConfig'
import type { Config } from "drizzle-kit";

import * as dotenv from "dotenv";
dotenv.config();

export default {
  schema: "./src/db/schema.ts", // Where Drizzle will write the schema
  out: "./drizzle", // Where migrations will live
  dialect: "mysql",
  dbCredentials: {
    host: AppConfig.MAIN_DB_HOST,
    user: AppConfig.MAIN_DB_USER,
    password: AppConfig.MAIN_DB_PASSWORD,
    database: AppConfig.MAIN_DB_NAME,
  },
  strict: false
} satisfies Config;
