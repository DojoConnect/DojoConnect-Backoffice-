import { Router } from "express";
import authRouter from "./auth.routes.js";
import dojosRouter from "./dojos.routes.js";
import appointmentsRouter from "./appointments.routes.js";
import devRouter from "./dev.routes.js";
import billingRouter from "./billing.routes.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

router.use("/auth", authRouter);
router.use("/dojos", dojosRouter);
router.use("/appointments", appointmentsRouter);
router.use("/billing", billingRouter);

router.use("/dev", devRouter);

export default router;
