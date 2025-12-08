import * as dbService from "./services/db.service";
import app from "./app";
import AppConfig, { appConfigSchema } from "./config/AppConfig";

/* ------------------ START ------------------ */
(async () => {
  try {
    const result = appConfigSchema.safeParse(AppConfig);
    if (!result.success) {
      throw new Error(`Server Error: Invalid AppConfig. Err: ${result.error}`);
    }

    await dbService.initMobileApiDB(); // ✅ ensure DB is ready before listen
    const PORT = AppConfig.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (e) {
    console.error("DB init failed:", e);
    process.exit(1);
  }
})();
