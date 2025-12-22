import { Router } from "express";
import { fetchDojoBySlug } from "../controllers/dojos.controller.js";

const router = Router();

router.get("/slug/:slug", fetchDojoBySlug);

export default router;
