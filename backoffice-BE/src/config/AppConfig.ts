import { z } from "zod";
import dotenv from "dotenv";
import { NodeEnv } from "../constants/enums.js";

dotenv.config();

export const appConfigSchema = z.object({
  PORT: z.number(),
  NODE_ENV: z.string(),
  ZOHO_EMAIL: z.string().nonempty(),
  ZOHO_PASSWORD: z.string().nonempty(),

  MAIN_DB_HOST: z.string().nonempty(),
  MAIN_DB_USER: z.string().nonempty(),
  MAIN_DB_PASSWORD: z.string(),
  MAIN_DB_NAME: z.string().nonempty(),

  BACK_OFFICE_DB_HOST: z.string().nonempty(),
  BACK_OFFICE_DB_USER: z.string().nonempty(),
  BACK_OFFICE_DB_PASSWORD: z.string(),
  BACK_OFFICE_DB_NAME: z.string().nonempty(),

  FIREBASE_CRED_FILE_PATH: z.string().nonempty(),

  JWT_ACCESS_SECRET: z.string().nonempty(),
  JWT_REFRESH_SECRET: z.string().nonempty(),

  STRIPE_SECRET_KEY: z.string().nonempty(),
  STRIPE_TEST_SECRET_KEY: z.string(),

  WEB_URL: z.string().nonempty().url(),
});

// extract the inferred type
export type IAppConfig = z.infer<typeof appConfigSchema>;

export const AppConfig: IAppConfig = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 5002,
  NODE_ENV: process.env.NODE_ENV || NodeEnv.Development,
  ZOHO_EMAIL: process.env.ZOHO_EMAIL || "",
  ZOHO_PASSWORD: process.env.ZOHO_PASSWORD || "",

  MAIN_DB_HOST: process.env.MAIN_DB_HOST || "",
  MAIN_DB_USER: process.env.MAIN_DB_USER || "",
  MAIN_DB_PASSWORD: process.env.MAIN_DB_PASSWORD || "",
  MAIN_DB_NAME: process.env.MAIN_DB_NAME || "",

  BACK_OFFICE_DB_HOST: process.env.BACK_OFFICE_DB_HOST || "",
  BACK_OFFICE_DB_USER: process.env.BACK_OFFICE_DB_USER || "",
  BACK_OFFICE_DB_PASSWORD: process.env.BACK_OFFICE_DB_PASSWORD || "",
  BACK_OFFICE_DB_NAME: process.env.BACK_OFFICE_DB_NAME || "",

  FIREBASE_CRED_FILE_PATH: process.env.FIREBASE_CRED_FILE_PATH || "",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_TEST_SECRET_KEY: process.env.STRIPE_TEST_SECRET_KEY || "",

  WEB_URL: process.env.WEB_URL || "",
};

export default AppConfig;
