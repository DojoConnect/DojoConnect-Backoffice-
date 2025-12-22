import { Router } from "express";
import {
  fetchAllAppointments,
  getAppointmentRequestById,
  createAppointment,
} from "../controllers/appointments.controller.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import { CreateAppointmentSchema } from "../validations/appointments.schemas.js";

const router = Router();

/* ------------------ CREATE A NEW APPOINTMENT REQUESTS ------------------ */
router.post(
  "/requests",
  validateReqBody(CreateAppointmentSchema),
  createAppointment
);

/* ------------------ FETCH ALL APPOINTMENT REQUESTS ------------------ */
router.get("/requests", fetchAllAppointments);

/* ------------------ FETCH APPOINTMENT REQUEST BY ID ------------------ */
router.get("/requests/:id", getAppointmentRequestById);

export default router;
