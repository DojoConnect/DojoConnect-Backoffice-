import { migrate } from "drizzle-orm/mysql2/migrator";
import { getDB } from "./index.js";

export const runMigrations = async () => {
  try {
    console.log("Running migrations...");
    await migrate(getDB(), { migrationsFolder: "drizzle" });
    console.log("Done!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
