import { createServer } from "http";
import * as dbService from "./services/db.service.js";
import app from "./app.js";
import AppConfig, { appConfigSchema } from "./config/AppConfig.js";
import { NodeEnv } from "./constants/enums.js";
import { runMigrations } from "./db/run-migrations.js";
import { initializeSocketIO } from "./socket/index.js";

/* ------------------ START ------------------ */
(async () => {
  try {
    const result = appConfigSchema.safeParse(AppConfig);
    if (!result.success) {
      throw new Error(`Server Error: Invalid AppConfig. Err: ${result.error}`);
    }

    if (AppConfig.NODE_ENV === NodeEnv.Production) {
      await runMigrations();
    }

    await dbService.initMobileApiDB(); // ✅ ensure DB is ready before listen

    // Create HTTP server from Express app
    const httpServer = createServer(app);

    // Initialize Socket.IO with the HTTP server
    // NOTE: Socket.IO rooms are in-memory only (single instance deployment)
    // See src/socket/index.ts for Redis upgrade path documentation
    initializeSocketIO(httpServer);

    const PORT = AppConfig.PORT || 5000;
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (e) {
    console.error("DB init failed:", e);
    process.exit(1);
  }
})();
