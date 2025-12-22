import mysql, { Connection } from "mysql2/promise";
import AppConfig from "../config/AppConfig.js";

/* ------------------ DB ------------------ */
let backOfficeDBConnection: Connection | null = null;
let mobileApiDbConnectionPool: mysql.Pool | null = null;

export const getBackOfficeDB = async () => {
  if (!backOfficeDBConnection) {
    backOfficeDBConnection = await initBackOfficeDB();
  }

  return backOfficeDBConnection;
};

export const getMobileApiDb = async () => {
  if (!mobileApiDbConnectionPool) {
    mobileApiDbConnectionPool = await initMobileApiDB();
  }

  return mobileApiDbConnectionPool;
};

export const initBackOfficeDB = async () => {
  backOfficeDBConnection = await mysql.createConnection({
    host: AppConfig.BACK_OFFICE_DB_HOST,
    user: AppConfig.BACK_OFFICE_DB_USER,
    password: AppConfig.BACK_OFFICE_DB_PASSWORD,
    database: AppConfig.BACK_OFFICE_DB_NAME,
    // timezone: 'Z', // optional: keep server-side dates in UTC
  });
  console.log("✅ MySQL trial_dojo connected");

  return backOfficeDBConnection;
};

export const initMobileApiDB = async () => {
  // Second database connection pool for backoffice features
  const combinePool = mysql.createPool({
    host: AppConfig.MAIN_DB_HOST,
    user: AppConfig.MAIN_DB_USER,
    password: AppConfig.MAIN_DB_PASSWORD,
    database: AppConfig.MAIN_DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Test combinePool connection
  combinePool
    .getConnection()
    .then((connection) => {
      console.log("✅ MySQL dojoburz_dojoconnect connected");
      connection.release();
    })
    .catch((err) => {
      console.error("❌ dojoburz_dojoconnect connection failed:", err.message);
    });

  return combinePool;
};
