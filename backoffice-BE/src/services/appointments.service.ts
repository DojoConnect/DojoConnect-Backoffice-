import { CreateAppointmentDto } from "../dtos/appointments.dtos.js";
import * as dbService from "./db.service.js";
import  {MailerService} from "./mailer.service.js";
import  {DojosService} from "./dojos.service.js";
import { NotFoundException } from "../core/errors/index.js";

export interface IAppointment {
  id?: number;
  dojo_id: number;
  parent_name: string;
  email_address: string;
  contact_details: string;
  reason_for_consultation: string;
  preferred_contact_method: string;
  preferred_time_range: string;
  number_of_children: number;
  additional_notes: string;
  consent_acknowledged: boolean;
  appointment_type: string;
  status: string;
  created_at: string;
}

/* ------------------ CREATE A NEW APPOINTMENT REQUESTS ------------------ */
export const createAppointment = async (data: CreateAppointmentDto) => {
  try {
    const {
      dojo_id, // required string dojo_tag
      parent_name,
      email_address,
      contact_details,
      reason_for_consultation,
      preferred_contact_method,
      preferred_time_range,
      number_of_children,
      additional_notes,
      consent_acknowledged,
      appointment_type,
      status,
    } = data;

    // normalize values
    const children = Number.isFinite(Number(number_of_children))
      ? Number(number_of_children)
      : null;

    const consent = !!consent_acknowledged ? 1 : 0;

    const connection = await dbService.getBackOfficeDB();

    const dojo = await DojosService.getOneDojoByID(dojo_id);

    if (!dojo) {
      throw new NotFoundException(`Dojo with ID ${dojo_id} not found`);
    }

    // Insert consultation request including dojo_email
    const [result]: any = await connection.execute(
      `INSERT INTO consultation_requests
       (dojo_tag, dojo_email, parent_name, email_address, contact_details, reason_for_consultation,
        preferred_contact_method, preferred_time_range, number_of_children,
        additional_notes, consent_acknowledged, appointment_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dojo.tag,
        dojo.ownerUserId,
        parent_name,
        email_address,
        contact_details,
        reason_for_consultation || null,
        preferred_contact_method || null,
        preferred_time_range || null,
        children,
        additional_notes || null,
        consent,
        appointment_type,
        status,
      ]
    );

    // Send confirmation email to parent
    await MailerService.sendAppointmentRequestConfirmation(
      email_address,
      parent_name,
      appointment_type,
      reason_for_consultation,
      preferred_time_range,
      children,
      dojo.name
    );

    // Insert notification for dojo owner
    const title = "New Appointment Request";
    const message = `Hi, your dojo has a new consultation request from ${parent_name}.`;
    await connection.execute(
      `INSERT INTO notifications (user_email, title, message, type, event_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        dojo.ownerUserId,
        title,
        message,
        "consultation_request",
        result.insertId.toString(),
        "pending",
      ]
    );

    return {
      id: result.insertId,
      dojo_tag: dojo.tag,
      dojo_email: dojo.ownerUserId,
      parent_name,
      email_address,
      contact_details,
      reason_for_consultation: reason_for_consultation || null,
      preferred_contact_method: preferred_contact_method || null,
      preferred_time_range: preferred_time_range || null,
      number_of_children: children,
      additional_notes: additional_notes || null,
      consent_acknowledged: !!consent_acknowledged,
      appointment_type,
      status,
      created_at: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error("Error creating consultation request:", err);
    throw err;
  }
};

export const getAllAppointments = async (): Promise<IAppointment[]> => {
  try {
    const connection = await dbService.getBackOfficeDB();
    const [rows] = await connection.execute(
      `SELECT id, dojo_id, parent_name, email_address, contact_details, reason_for_consultation,
              preferred_contact_method, preferred_time_range, number_of_children,
              additional_notes, consent_acknowledged, appointment_type, status, created_at
       FROM consultation_requests
       ORDER BY created_at DESC`
    );
    return rows as IAppointment[];
  } catch (err: any) {
    console.error("Error fetching consultation requests:", err);
    throw new Error(err);
  }
};

/* ------------------ FETCH APPOINTMENT REQUEST BY ID ------------------ */
export const getAppointmentRequestById = async (appointmentReqId: number) => {
  try {
    const connection = await dbService.getBackOfficeDB();
    const [rows]: any = await connection.execute(
      `SELECT id, dojo_id, parent_name, email_address, contact_details, reason_for_consultation,
              preferred_contact_method, preferred_time_range, number_of_children,
              additional_notes, consent_acknowledged, appointment_type, status, created_at
       FROM consultation_requests
       WHERE id = ?`,
      [appointmentReqId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (err: any) {
    console.error("Error fetching consultation request details:", err);
    throw err;
  }
};
