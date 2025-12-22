import { Request, Response } from "express";
import { NotFoundException } from "../core/errors/index.js";
import * as appointmentsService from "../services/appointments.service.js";
import { formatApiResponse } from "../utils/api.utils.js";

export const createAppointment = async (req: Request, res: Response) => {
  const createdAppointment = await appointmentsService.createAppointment(
    req.body
  );
  res.status(201).json(
    formatApiResponse({
      data: createdAppointment,
      message: "Appointment created successfully",
    })
  );
};

export const fetchAllAppointments = async (_req, res) => {
  const appointments = await appointmentsService.getAllAppointments();
  res.status(200).json(formatApiResponse({ data: appointments }));
};

export const getAppointmentRequestById = async (req, res) => {
  const appointmentReqId = req.params.id;
  const appointmentReq = await appointmentsService.getAppointmentRequestById(
    req.params.id
  );

  if (!appointmentReq) {
    throw new NotFoundException(
      `Consultation request with ID ${appointmentReqId} not found`
    );
  }

  res.status(200).json(formatApiResponse({ data: appointmentReq }));
};
