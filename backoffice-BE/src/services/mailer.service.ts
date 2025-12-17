import AppConfig from "../config/AppConfig";
import nodemailer from "nodemailer";
import { Role } from "../constants/enums";

type SendPasswordResetMailParams = {
  dest: string;
  name: string;
  otp: string;
};

let transporterInstance: any = null;

export const getTransporter = () => {
  if (transporterInstance) {
    return transporterInstance;
  }

  transporterInstance = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: {
      user: AppConfig.ZOHO_EMAIL,
      pass: AppConfig.ZOHO_PASSWORD,
    },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    logger: true,
    debug: true,
    tls: { servername: "smtp.zoho.com" },
  });

  return transporterInstance;
};

// 1. Appointment Request Confirmation Email
export const sendAppointmentRequestConfirmation = async (
  to,
  parentName,
  appointmentType,
  reason,
  timeRange,
  numberOfChildren,
  dojoName
) => {
  const mailOptions = {
    from: `"Dojo Connect" <${AppConfig.ZOHO_EMAIL || "hello@dojoconnect.app"}>`,
    to,
    subject: "Your Appointment Request Has Been Received",
    html: `
      <h2>Hello ${parentName},</h2>
      <p>Thank you for requesting an appointment with <strong>${dojoName}</strong>. We've successfully received your request and our team will review the details.</p>
      
      <p><strong>Here's a summary of your request:</strong></p>
      <ul>
        <li><b>Appointment Type:</b> ${appointmentType}</li>
        <li><b>Reason for Consultation:</b> ${reason || "Not provided"}</li>
        <li><b>Preferred Time Range:</b> ${timeRange || "Not provided"}</li>
        <li><b>Number of Children:</b> ${
          numberOfChildren || "Not provided"
        }</li>
      </ul>
      
      <p>We will get back to you shortly with the confirmed date, time, and meeting details.</p>
      
      <p>Best regards,<br/>The ${dojoName} Team</p>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`📧 Appointment request confirmation email sent to ${to}`);
  } catch (err: any) {
    console.error("❌ Error sending email:", err.message);
  }
};

// 2. Appointment Scheduled Email - Physical Meeting
export const sendPhysicalAppointmentScheduled = async (
  to,
  parentName,
  scheduledDate,
  startTime,
  dojoName,
  dojoAddress,
  preferredContactMethod
) => {
  const formattedDate = new Date(scheduledDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      AppConfig.ZOHO_EMAIL || "hello@dojoconnect.app"
    }>`,
    to,
    subject: "Your Appointment Has Been Scheduled",
    html: `
      <h2>Hello ${parentName},</h2>
      <p>Your appointment with <strong>${dojoName}</strong> has been scheduled successfully.</p>
      
      <p><strong>Appointment Details</strong></p>
      <ul>
        <li><b>Date:</b> ${formattedDate}</li>
        <li><b>Time:</b> ${startTime}</li>
        <li><b>Type:</b> Physical</li>
        <li><b>Meeting Location:</b> ${dojoAddress}</li>
      </ul>
      
      <p>If you have any questions before the appointment, please reach out via ${
        preferredContactMethod || "email"
      }.</p>
      
      <p>We look forward to meeting you.</p>
      
      <p>Best regards,<br/>The ${dojoName} Team</p>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`📧 Physical appointment scheduled email sent to ${to}`);
  } catch (err: any) {
    console.error("❌ Error sending email:", err.message);
  }
};

// 3. Appointment Scheduled Email - Online
export const sendOnlineAppointmentScheduled = async (
  to,
  parentName,
  scheduledDate,
  startTime,
  dojoName,
  meetingLink,
  preferredContactMethod
) => {
  const formattedDate = new Date(scheduledDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      AppConfig.ZOHO_EMAIL || "hello@dojoconnect.app"
    }>`,
    to,
    subject: "Your Online Appointment Has Been Scheduled",
    html: `
      <h2>Hello ${parentName},</h2>
      <p>Your online appointment with <strong>${dojoName}</strong> has been scheduled successfully.</p>
      
      <p><strong>Appointment Details</strong></p>
      <ul>
        <li><b>Date:</b> ${formattedDate}</li>
        <li><b>Time:</b> ${startTime}</li>
        <li><b>Meeting Link:</b> <a href="${meetingLink}">${meetingLink}</a></li>
      </ul>
      
      <p>Please join the meeting using the link above at the scheduled time. If you encounter any issues, reach us via ${
        preferredContactMethod || "email"
      }.</p>
      
      <p>We look forward to meeting you online.</p>
      
      <p>Best regards,<br/>The ${dojoName} Team</p>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`📧 Online appointment scheduled email sent to ${to}`);
  } catch (err: any) {
    console.error("❌ Error sending email:", err.message);
  }
};

// 4. Appointment Cancellation Email
export const sendAppointmentCancellation = async (
  to,
  parentName,
  scheduledDate,
  startTime,
  dojoName,
  dojoWebPageUrl
) => {
  const formattedDate = new Date(scheduledDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      AppConfig.ZOHO_EMAIL || "hello@dojoconnect.app"
    }>`,
    to,
    subject: "Appointment Canceled",
    html: `
      <h2>Hello ${parentName},</h2>
      <p>We regret to inform you that your scheduled appointment with <strong>${dojoName}</strong> on <strong>${formattedDate}</strong> at <strong>${startTime}</strong> has been canceled.</p>
      
      ${
        dojoWebPageUrl
          ? `<p>If you would like, you can request a new appointment anytime by visiting our dojo web page: <a href="${dojoWebPageUrl}">${dojoWebPageUrl}</a>.</p>`
          : ""
      }
      
      <p>We apologize for any inconvenience and appreciate your understanding.</p>
      
      <p>Best regards,<br/>The ${dojoName} Team</p>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`📧 Appointment cancellation email sent to ${to}`);
  } catch (err: any) {
    console.error("❌ Error sending email:", err.message);
  }
};

// 5. Appointment Reschedule Email - Online
export const sendOnlineAppointmentReschedule = async (
  to,
  parentName,
  newDate,
  newTime,
  dojoName,
  newMeetingLink
) => {
  const formattedDate = new Date(newDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      AppConfig.ZOHO_EMAIL || "hello@dojoconnect.app"
    }>`,
    to,
    subject: "Appointment Update – Rescheduled",
    html: `
      <h2>Hello ${parentName},</h2>
      <p>Your online appointment with <strong>${dojoName}</strong> has been rescheduled. Please find the updated details below:</p>
      
      <p><strong>New Appointment Details</strong></p>
      <ul>
        <li><b>Date:</b> ${formattedDate}</li>
        <li><b>Time:</b> ${newTime}</li>
        <li><b>Meeting Link:</b> <a href="${newMeetingLink}">${newMeetingLink}</a></li>
      </ul>
      
      <p>We appreciate your flexibility and look forward to meeting you online at the new time.</p>
      
      <p>Best regards,<br/>The ${dojoName} Team</p>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`📧 Online appointment reschedule email sent to ${to}`);
  } catch (err: any) {
    console.error("❌ Error sending email:", err.message);
  }
};

// 6. Appointment Reschedule Email - Physical
export const sendPhysicalAppointmentReschedule = async (
  to,
  parentName,
  newDate,
  newTime,
  dojoName,
  newAddress
) => {
  const formattedDate = new Date(newDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${AppConfig.ZOHO_EMAIL || "hello@dojoconnect.app"}>`,
    to,
    subject: "Appointment Update – Rescheduled",
    html: `
      <h2>Hello ${parentName},</h2>
      <p>Your in-person appointment with <strong>${dojoName}</strong> has been rescheduled. Please find the updated details below:</p>
      
      <p><strong>New Appointment Details</strong></p>
      <ul>
        <li><b>Date:</b> ${formattedDate}</li>
        <li><b>Time:</b> ${newTime}</li>
        <li><b>Location:</b> ${newAddress}</li>
      </ul>
      
      <p>We look forward to seeing you at the dojo on the new date.</p>
      
      <p>Best regards
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`📧 Physical appointment reschedule email sent to ${to}`);
  } catch (err: any) {
    console.error("❌ Error sending email:", err.message);
  }
};

// 7. Trial Class Booking Confirmation Email
export const sendTrialClassBookingConfirmation = async (
  to,
  parentName,
  className,
  instructorName,
  appointmentDate,
  numberOfChildren,
  trialFee,
  dojoName
) => {
  const formattedDate = new Date(appointmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      AppConfig.ZOHO_EMAIL || "hello@dojoconnect.app"
    }>`,
    to,
    subject: "Your Trial Class Booking Has Been Confirmed",
    html: `
      <h2>Hello ${parentName},</h2>
      <p>Thank you for booking a trial class with <strong>${dojoName}</strong>! We're excited to have you join us.</p>
      
      <p><strong>Trial Class Details</strong></p>
      <ul>
        <li><b>Class:</b> ${className || "Trial Class"}</li>
        ${instructorName ? `<li><b>Instructor:</b> ${instructorName}</li>` : ""}
        <li><b>Date:</b> ${formattedDate}</li>
        <li><b>Number of Children:</b> ${numberOfChildren || 1}</li>
        ${
          trialFee > 0
            ? `<li><b>Trial Fee:</b> $${trialFee}</li>`
            : "<li><b>Trial Fee:</b> Free</li>"
        }
      </ul>
      
      <p><strong>What to Bring:</strong></p>
      <ul>
        <li>Comfortable workout attire</li>
        <li>Water bottle</li>
        <li>A positive attitude and willingness to learn!</li>
      </ul>
      
      <p>Please arrive 10-15 minutes early to complete any necessary paperwork and get settled in.</p>
      
      <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact us.</p>
      
      <p>We look forward to seeing you soon!</p>
      
      <p>Best regards,<br/>The ${dojoName} Team</p>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`📧 Trial class booking confirmation email sent to ${to}`);
  } catch (err: any) {
    console.error("❌ Error sending email:", err.message);
  }
};

export const sendWelcomeEmail = async (
  dest: string,
  name: string,
  role: Role
) => {
  try {
    let subject, body;

    if (role === Role.DojoAdmin) {
      subject = "Welcome to Dojo Connect - Your Admin Dashboard is Ready";
      body = `<p>Hi <strong>${name}</strong>,</p>
                    <p>Welcome to Dojo Connect! Your admin access has been successfully activated.</p>
                    <p>As an admin, you now have full control to manage your dojo.</p>
                    <p>Warm regards,<br>The Dojo Connect Team</p>`;
    } else {
      subject = "Welcome to Dojo Connect";
      body = `<p>Hi <strong>${name}</strong>,</p>
                    <p>Your account has been successfully created as a <strong>${role}</strong>.</p>
                    <p>You can now login and explore your dashboard.</p>
                    <p>– The Dojo Connect Team</p>`;
    }

    const mailOptions = {
      from: '"Dojo Connect" <support@dojoconnect.app>',
      to: dest,
      subject: subject,
      html: body,
      charset: "UTF-8",
    };

    await getTransporter().sendMail(mailOptions);
  } catch (error: any) {
    console.error(`Welcome email failed to ${dest}: ${error.message}`);
  }
};


export const sendPasswordResetMail = async ({
  dest,
  name,
  otp,
}: SendPasswordResetMailParams): Promise<void> => {

  try {
    const mailOptions = {
      from: `"Dojo Connect" <${AppConfig.ZOHO_EMAIL}>`,
      to: dest,
      subject: "Your Dojo Connect Password Reset Code",
      html: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password.</p>
      <p>Your password reset code is:</p>
      <h2 style="color:#e51b1b; font-size:24px;">${otp}</h2>
      <p>This code will expire in 15 mins.</p>
      <p>If you didn’t request this, you can ignore this email.</p>
      <p>– Dojo Connect Team</p>
    `,
    };

    await getTransporter().sendMail(mailOptions);
  } catch (error: any) {
    console.error(`Password reset email failed to ${dest}: ${error.message}`);
  }
};