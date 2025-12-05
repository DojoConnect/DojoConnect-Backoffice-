import { Router } from "express";
import { fetchDojoBySlug } from "../controllers/dojos.controller";

const router = Router();

router.get("/slug/:slug", fetchDojoBySlug);

export default router;
