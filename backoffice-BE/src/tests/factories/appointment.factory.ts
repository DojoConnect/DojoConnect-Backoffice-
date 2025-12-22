import { AppointmentStatus, AppointmentType } from "../../constants/enums.js";
import { IAppointment } from "../../services/appointments.service.js";

/**
 * Creates a mock appointment object for testing purposes.
 * Provides sensible defaults for all required fields.
 *
 * @param overrides - An object with properties to override the default mock data.
 * @returns A complete mock `IAppointment` object.
 */
export const buildAppointmentMock = (
  overrides?: Partial<IAppointment>
): IAppointment => {
  return {
    id: 1,
    dojo_id: 1,
    parent_name: "Jane Doe",
    email_address: "jane.doe@example.com",
    contact_details: "555-123-4567",
    reason_for_consultation: "Initial assessment for my child.",
    preferred_contact_method: "Email",
    preferred_time_range: "Afternoon (2pm-5pm)",
    number_of_children: 1,
    additional_notes: "My child is 7 years old.",
    consent_acknowledged: true,
    appointment_type: AppointmentType.Online,
    status: AppointmentStatus.Pending,
    created_at: new Date().toISOString(),
    ...overrides, // Allows overriding specific fields for different test scenarios
  };
};
