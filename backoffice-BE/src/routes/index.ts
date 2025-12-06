import { Router } from "express";
import dojosRouter from "./dojos.route";
import appointmentsRouter from "./appointments.route";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

router.use("/dojos", dojosRouter);
router.use('/appointments', appointmentsRouter)

export default router;
