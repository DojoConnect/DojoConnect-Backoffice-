import mysql, { Connection } from "mysql2/promise";
import AppConfig from "../config/AppConfig";

/* ------------------ DB ------------------ */
let connection : Connection | null = null;

export const getDBConnection = async () => {
    if (!connection) {
        connection = await initDB();
    }

    return connection;
}

const  initDB = async () => {
  connection = await mysql.createConnection({
    host: AppConfig.BACK_OFFICE_DB_HOST,
    user: AppConfig.BACK_OFFICE_DB_USER,
    password: AppConfig.BACK_OFFICE_DB_PASSWORD,
    database: AppConfig.BACK_OFFICE_DB_NAME,
    // timezone: 'Z', // optional: keep server-side dates in UTC
  });
  console.log("✅ MySQL trial_dojo connected");

  return connection;
}






