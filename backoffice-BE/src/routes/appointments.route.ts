import { Router } from "express";
import {
  fetchAllAppointments,
  getAppointmentRequestById,
  createAppointment,
} from "../controllers/appointments.controller";
import { validateReqBody } from "../middlewares/validate.middleware";
import { CreateAppointmentSchema } from "../validations/appointments.schemas";

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
