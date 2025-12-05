import { Router } from "express";
import dojosRouter from "./dojos.route";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

router.use("/dojos", dojosRouter);

export default router;
