import { Router } from "express";
import authRouter from "./auth.routes";
import dojosRouter from "./dojos.route";
import appointmentsRouter from "./appointments.route";
import devRouter from "./dev.routes";
import billingRouter from "./billing.routes";

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
