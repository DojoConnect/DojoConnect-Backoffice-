import { drizzle, MySql2Database } from "drizzle-orm/mysql2"; // 1. Import the type
import mysql from "mysql2/promise";
import * as schema from "./schema.js";
import AppConfig from "../config/AppConfig.js";

// 2. Define the type explicitly using your schema
export type DB = MySql2Database<typeof schema>;

let dbInstance: DB | null = null;

export const getDB = () => {
  if (dbInstance) {
    return dbInstance;
  }

  const poolConnection = mysql.createPool({
    host: AppConfig.MAIN_DB_HOST,
    user: AppConfig.MAIN_DB_USER,
    password: AppConfig.MAIN_DB_PASSWORD,
    database: AppConfig.MAIN_DB_NAME,
    // ... other existing config
  });

  dbInstance = drizzle(poolConnection, { schema, mode: "default" });

  return dbInstance;
};

export type Transaction = ReturnType<typeof getDB>;

export const runInTransaction = async <T>(
  fn: (tx: Transaction) => Promise<T>
): Promise<T> => getDB().transaction(fn);
