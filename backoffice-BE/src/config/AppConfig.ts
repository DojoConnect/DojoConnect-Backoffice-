import { z } from "zod";
import dotenv from "dotenv";

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
});

// extract the inferred type
export type IAppConfig = z.infer<typeof appConfigSchema>;

export const AppConfig: IAppConfig = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 5002,
  NODE_ENV: process.env.NODE_ENV || "development",
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
};

export default AppConfig;
