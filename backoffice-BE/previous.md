const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json()); // bodyParser not needed

/_ ------------------ DB ------------------ _/
let connection;
async function initDB() {
connection = await mysql.createConnection({
host: "localhost",
user: "dojoburz_trial",
password: "]!pT(TqFTj^h",
database: "dojoburz_trial",
// timezone: 'Z', // optional: keep server-side dates in UTC
});
console.log("✅ MySQL connected");

}
// pass: "-rb=l$!C\_@Uf"

const transporter = nodemailer.createTransport({
host: "smtp.zoho.com",  
 port: 465,
secure: true,  
 auth: {
user: process.env.ZOHO_EMAIL || "hello@dojoconnect.app",
pass: process.env.ZOHO_PASSWORD || "Connectdojo1!"
},
connectionTimeout: 20000,
greetingTimeout: 15000,
socketTimeout: 30000,
logger: true,
debug: true,
tls: { servername: "smtp.zoho.com" }
});

/_ ---------- helpers ---------- _/
// slug util
const slugify = (str) =>
str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// unique slug
async function generateUniqueSlug(name) {
let baseSlug = slugify(name);
let slug = baseSlug;
let counter = 1;

while (true) {
const [rows] = await connection.execute(
"SELECT COUNT(\*) as count FROM dojos WHERE slug = ?",
[slug]
);
if (rows[0].count === 0) return slug;
slug = `${baseSlug}-${counter++}`;
}
}

const toDojoTag = (str) =>
str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|\_+$/g, "");

async function generateUniqueDojoTag(name) {
let baseTag = toDojoTag(name);
let tag = baseTag;
let counter = 1;

while (true) {
const [rows] = await connection.execute(
"SELECT COUNT(\*) as count FROM users WHERE dojo*tag = ?",
[tag]
);
if (rows[0].count === 0) return tag;
tag = `${baseTag}*${counter++}`;
}
}

/\*\* Convert JS Date or ISO string to "YYYY-MM-DD HH:MM:SS"

- Use this for INSERTing into DATETIME columns.
  \*/
  function toMySQLDateTime(input) {
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  // produce local-wall time without timezone designator
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }

/\*_ Normalize appointment type to 'physical' | 'online' _/
function normalizeApptType(value) {
if (!value) return "Online"; // default
return value.toLowerCase() === "physical" ? "Physical" : "Online";
}

/\*_ Convert time from "HH:MM AM/PM" format to "HH:MM:SS" 24-hour format for MySQL _/
function convertTo24Hour(time12h) {
if (!time12h) return null;

// If already in 24-hour format (HH:MM or HH:MM:SS), return as is
if (!/AM|PM|am|pm/i.test(time12h)) {
// Add seconds if not present
return time12h.includes(':') && time12h.split(':').length === 2
? `${time12h}:00`
: time12h;
}

// Parse 12-hour format
const timePattern = /(\d{1,2}):(\d{2})\s\*(AM|PM|am|pm)/i;
const match = time12h.match(timePattern);

if (!match) return time12h; // Return as is if pattern doesn't match

let hours = parseInt(match[1], 10);
const minutes = match[2];
const period = match[3].toUpperCase();

// Convert to 24-hour format
if (period === 'PM' && hours !== 12) {
hours += 12;
} else if (period === 'AM' && hours === 12) {
hours = 0;
}

return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

/\*_ Convert time from "HH:MM:SS" 24-hour format to "HH:MM AM/PM" for display _/
function convertTo12Hour(time24h) {
if (!time24h) return '';

// If already in 12-hour format, return as is
if (/AM|PM|am|pm/i.test(time24h)) {
return time24h;
}

const [hoursStr, minutesStr] = time24h.split(':');
let hours = parseInt(hoursStr, 10);
const minutes = minutesStr;

const period = hours >= 12 ? 'PM' : 'AM';

if (hours > 12) {
hours -= 12;
} else if (hours === 0) {
hours = 12;
}

return `${hours}:${minutes} ${period}`;
}

/\*_ Helper for Sending Appointment Emails _/

// 1. Appointment Request Confirmation Email
async function sendAppointmentRequestConfirmation(to, parentName, appointmentType, reason, timeRange, numberOfChildren, dojoName) {
const mailOptions = {
from: `"Dojo Connect" <${process.env.ZOHO_EMAIL || "hello@dojoconnect.app"}>`,
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
        <li><b>Number of Children:</b> ${numberOfChildren || "Not provided"}</li>
      </ul>

      <p>We will get back to you shortly with the confirmed date, time, and meeting details.</p>

      <p>Best regards,<br/>The ${dojoName} Team</p>
    `,

};

try {
await transporter.sendMail(mailOptions);
console.log(`📧 Appointment request confirmation email sent to ${to}`);
} catch (err) {
console.error("❌ Error sending email:", err.message);
}
}

// 2. Appointment Scheduled Email - Physical Meeting
async function sendPhysicalAppointmentScheduled(to, parentName, scheduledDate, startTime, dojoName, dojoAddress, preferredContactMethod) {
const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
weekday: 'long',
year: 'numeric',
month: 'long',
day: 'numeric'
});

const mailOptions = {
from: `"Dojo Connect" <${process.env.ZOHO_EMAIL || "hello@dojoconnect.app"}>`,
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

      <p>If you have any questions before the appointment, please reach out via ${preferredContactMethod || "email"}.</p>

      <p>We look forward to meeting you.</p>

      <p>Best regards,<br/>The ${dojoName} Team</p>
    `,

};

try {
await transporter.sendMail(mailOptions);
console.log(`📧 Physical appointment scheduled email sent to ${to}`);
} catch (err) {
console.error("❌ Error sending email:", err.message);
}
}

// 3. Appointment Scheduled Email - Online
async function sendOnlineAppointmentScheduled(to, parentName, scheduledDate, startTime, dojoName, meetingLink, preferredContactMethod) {
const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
weekday: 'long',
year: 'numeric',
month: 'long',
day: 'numeric'
});

const mailOptions = {
from: `"Dojo Connect" <${process.env.ZOHO_EMAIL || "hello@dojoconnect.app"}>`,
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

      <p>Please join the meeting using the link above at the scheduled time. If you encounter any issues, reach us via ${preferredContactMethod || "email"}.</p>

      <p>We look forward to meeting you online.</p>

      <p>Best regards,<br/>The ${dojoName} Team</p>
    `,

};

try {
await transporter.sendMail(mailOptions);
console.log(`📧 Online appointment scheduled email sent to ${to}`);
} catch (err) {
console.error("❌ Error sending email:", err.message);
}
}

// 4. Appointment Cancellation Email
async function sendAppointmentCancellation(to, parentName, scheduledDate, startTime, dojoName, dojoWebPageUrl) {
const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
weekday: 'long',
year: 'numeric',
month: 'long',
day: 'numeric'
});

const mailOptions = {
from: `"Dojo Connect" <${process.env.ZOHO_EMAIL || "hello@dojoconnect.app"}>`,
to,
subject: "Appointment Canceled",
html: `
<h2>Hello ${parentName},</h2>
      <p>We regret to inform you that your scheduled appointment with <strong>${dojoName}</strong> on <strong>${formattedDate}</strong> at <strong>${startTime}</strong> has been canceled.</p>

      ${dojoWebPageUrl ? `<p>If you would like, you can request a new appointment anytime by visiting our dojo web page: <a href="${dojoWebPageUrl}">${dojoWebPageUrl}</a>.</p>` : ''}

      <p>We apologize for any inconvenience and appreciate your understanding.</p>

      <p>Best regards,<br/>The ${dojoName} Team</p>
    `,

};

try {
await transporter.sendMail(mailOptions);
console.log(`📧 Appointment cancellation email sent to ${to}`);
} catch (err) {
console.error("❌ Error sending email:", err.message);
}
}

// 5. Appointment Reschedule Email - Online
async function sendOnlineAppointmentReschedule(to, parentName, newDate, newTime, dojoName, newMeetingLink) {
const formattedDate = new Date(newDate).toLocaleDateString('en-US', {
weekday: 'long',
year: 'numeric',
month: 'long',
day: 'numeric'
});

const mailOptions = {
from: `"Dojo Connect" <${process.env.ZOHO_EMAIL || "hello@dojoconnect.app"}>`,
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
await transporter.sendMail(mailOptions);
console.log(`📧 Online appointment reschedule email sent to ${to}`);
} catch (err) {
console.error("❌ Error sending email:", err.message);
}
}

// 6. Appointment Reschedule Email - Physical
async function sendPhysicalAppointmentReschedule(to, parentName, newDate, newTime, dojoName, newAddress) {
const formattedDate = new Date(newDate).toLocaleDateString('en-US', {
weekday: 'long',
year: 'numeric',
month: 'long',
day: 'numeric'
});

const mailOptions = {
from: `"Dojo Connect" <${process.env.ZOHO_EMAIL || "hello@dojoconnect.app"}>`,
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
await transporter.sendMail(mailOptions);
console.log(`📧 Physical appointment reschedule email sent to ${to}`);
} catch (err) {
console.error("❌ Error sending email:", err.message);
}
}

// 7. Trial Class Booking Confirmation Email
async function sendTrialClassBookingConfirmation(to, parentName, className, instructorName, appointmentDate, numberOfChildren, trialFee, dojoName) {
const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
weekday: 'long',
year: 'numeric',
month: 'long',
day: 'numeric'
});

const mailOptions = {
from: `"Dojo Connect" <${process.env.ZOHO_EMAIL || "hello@dojoconnect.app"}>`,
to,
subject: "Your Trial Class Booking Has Been Confirmed",
html: `
<h2>Hello ${parentName},</h2>
      <p>Thank you for booking a trial class with <strong>${dojoName}</strong>! We're excited to have you join us.</p>

      <p><strong>Trial Class Details</strong></p>
      <ul>
        <li><b>Class:</b> ${className || "Trial Class"}</li>
        ${instructorName ? `<li><b>Instructor:</b> ${instructorName}</li>` : ''}
        <li><b>Date:</b> ${formattedDate}</li>
        <li><b>Number of Children:</b> ${numberOfChildren || 1}</li>
        ${trialFee > 0 ? `<li><b>Trial Fee:</b> $${trialFee}</li>` : '<li><b>Trial Fee:</b> Free</li>'}
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
await transporter.sendMail(mailOptions);
console.log(`📧 Trial class booking confirmation email sent to ${to}`);
} catch (err) {
console.error("❌ Error sending email:", err.message);
}
}

/_ ------------------ DOJOS ------------------ _/

app.get("/dojos/slug/:slug", async (req, res) => {
try {
const [rows] = await connection.execute(
`SELECT id, name, email, role, dojo_id, dojo_name, dojo_tag, tagline, description, created_at
       FROM users
       WHERE dojo_tag = ?`,
[req.params.slug]
);

    if (rows.length === 0) return res.status(404).json({ error: "Dojo not found" });
    res.json(rows[0]);

} catch (err) {
res.status(500).json({ error: err.message });
}
});

/_ ------------------ TRIAL CLASS BOOKINGS CREATE ------------------ _/

app.post("/trial-class-bookings", async (req, res) => {
try {
const {
class_id,
parent_name,
email,
phone,
appointment_date,
dojo_tag,
status,
number_of_children,
class_name,
instructor_name,
class_image,
trial_fee
} = req.body;

    // Validate required fields
    if (!class_id || !parent_name || !email || !phone || !appointment_date || !dojo_tag) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [result] = await connection.execute(
      `INSERT INTO trial_class_bookings
      (class_id, parent_name, email, phone, appointment_date, dojo_tag, status, number_of_children, class_name, instructor_name, class_image, trial_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        class_id,
        parent_name,
        email,
        phone,
        appointment_date,
        dojo_tag,
        status || "pending",
        number_of_children || 1,
        class_name || null,
        instructor_name || null,
        class_image || null,
        trial_fee || 0
      ]
    );

    // Get dojo name for email
    const [dojoRows] = await connection.execute(
      "SELECT dojo_name FROM users WHERE dojo_tag = ? LIMIT 1",
      [dojo_tag]
    );
    const dojoName = dojoRows.length > 0 ? dojoRows[0].dojo_name : "Trial Dojo";

    // Send trial class booking confirmation email
    await sendTrialClassBookingConfirmation(
      email,
      parent_name,
      class_name,
      instructor_name,
      appointment_date,
      number_of_children || 1,
      trial_fee || 0,
      dojoName
    );

    res.status(201).json({
      id: result.insertId,
      class_id,
      parent_name,
      email,
      phone,
      appointment_date,
      dojo_tag,
      status: status || "pending",
      number_of_children: number_of_children || 1,
      class_name: class_name || null,
      instructor_name: instructor_name || null,
      class_image: class_image || null,
      trial_fee: trial_fee || 0,
      created_at: new Date().toISOString(),
    });

} catch (error) {
console.error("Error creating trial booking:", error.message);
res.status(500).json({ error: "Failed to create trial booking" });
}
});

/_ ------------------ FETCH TRIAL CLASS BOOKINGS BY DOJOTAG ------------------ _/
app.get("/trial-class-bookings/:dojo_tag", async (req, res) => {
try {
const { dojo_tag } = req.params;
const [rows] = await connection.execute(
`SELECT id, class_id, parent_name, email, phone, number_of_children,
              appointment_date, payment_status, status, dojo_tag,
              class_name, instructor_name, class_image, trial_fee,
              created_at, updated_at
       FROM trial_class_bookings
       WHERE dojo_tag = ?
       ORDER BY created_at DESC`,
[dojo_tag]
);
res.json(rows);
} catch (err) {
console.error("Error fetching trial bookings:", err.message);
res.status(500).json({ error: err.message });
}
});

/_ ------------------ FETCH TRIAL CLASS BOOKINGS DETAILS BY ID ------------------ _/
app.get("/trial-class-bookings/details/:id", async (req, res) => {
try {
const { id } = req.params;

    const [rows] = await connection.execute(
      `SELECT id, class_id, parent_name, email, phone, appointment_date, dojo_tag,
              status, number_of_children, class_name, instructor_name, class_image, trial_fee,
              created_at, updated_at
       FROM trial_class_bookings
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Trial class booking not found" });
    }

    res.json(rows[0]);

} catch (err) {
console.error("Error fetching trial booking details:", err.message);
res.status(500).json({ error: "Failed to fetch trial booking details" });
}
});

/_ ------------------ CREATE A NEW APPOINTMENT REQUESTS ------------------ _/
app.post("/appointment-requests", async (req, res) => {
try {
const {
dojo_tag, // required string dojo_tag
dojo_email, // required dojo owner's email
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
} = req.body || {};

    if (!parent_name || !email_address || !contact_details || consent_acknowledged === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!dojo_tag || !dojo_email) {
      return res.status(400).json({ error: "dojo_tag and dojo_email are required" });
    }

    // normalize values
    const children = Number.isFinite(Number(number_of_children)) ? Number(number_of_children) : null;
    const appointment_type_normalized = normalizeApptType(appointment_type);
    const validStatuses = ["pending", "upcoming", "completed"];
    const safeStatus = validStatuses.includes(status) ? status : "pending";
    const consent = !!consent_acknowledged ? 1 : 0;

    // Insert consultation request including dojo_email
    const [result] = await connection.execute(
      `INSERT INTO consultation_requests
       (dojo_tag, dojo_email, parent_name, email_address, contact_details, reason_for_consultation,
        preferred_contact_method, preferred_time_range, number_of_children,
        additional_notes, consent_acknowledged, appointment_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dojo_tag,
        dojo_email,
        parent_name,
        email_address,
        contact_details,
        reason_for_consultation || null,
        preferred_contact_method || null,
        preferred_time_range || null,
        children,
        additional_notes || null,
        consent,
        appointment_type_normalized,
        safeStatus
      ]
    );

    // Get dojo name for email
    const [dojoRows] = await connection.execute(
      "SELECT dojo_name FROM users WHERE dojo_tag = ? LIMIT 1",
      [dojo_tag]
    );
    const dojoName = dojoRows.length > 0 ? dojoRows[0].dojo_name : "Trial Dojo";

    // Send confirmation email to parent
    await sendAppointmentRequestConfirmation(
      email_address,
      parent_name,
      appointment_type_normalized,
      reason_for_consultation,
      preferred_time_range,
      children,
      dojoName
    );

    // Insert notification for dojo owner
    const title = "New Appointment Request";
    const message = `Hi, your dojo has a new consultation request from ${parent_name}.`;
    await connection.execute(
      `INSERT INTO notifications (user_email, title, message, type, event_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dojo_email, title, message, "consultation_request", result.insertId.toString(), "pending"]
    );

    res.status(201).json({
      id: result.insertId,
      dojo_tag,
      dojo_email,
      parent_name,
      email_address,
      contact_details,
      reason_for_consultation: reason_for_consultation || null,
      preferred_contact_method: preferred_contact_method || null,
      preferred_time_range: preferred_time_range || null,
      number_of_children: children,
      additional_notes: additional_notes || null,
      consent_acknowledged: !!consent_acknowledged,
      appointment_type: appointment_type_normalized,
      status: safeStatus,
      created_at: new Date().toISOString(),
    });

} catch (err) {
console.error("Error creating consultation request:", err);
res.status(500).json({ error: "Internal Server Error", detail: err.message });
}
});

/_ ------------------ FETCH ALL APPOINTMENT REQUESTS ------------------ _/
app.get("/appointment-requests", async (\_req, res) => {
try {
const [rows] = await connection.execute(
`SELECT id, dojo_id, parent_name, email_address, contact_details, reason_for_consultation,
              preferred_contact_method, preferred_time_range, number_of_children,
              additional_notes, consent_acknowledged, appointment_type, status, created_at
       FROM consultation_requests
       ORDER BY created_at DESC`
);
res.json(rows);
} catch (err) {
console.error("Error fetching consultation requests:", err);
res.status(500).json({ error: "Internal Server Error", detail: err.message });
}
});

/_ ------------------ FETCH APPOINTMENT REQUEST BY ID ------------------ _/
app.get("/appointment-requests/:id", async (req, res) => {
try {
const [rows] = await connection.execute(
`SELECT id, dojo_id, parent_name, email_address, contact_details, reason_for_consultation,
              preferred_contact_method, preferred_time_range, number_of_children,
              additional_notes, consent_acknowledged, appointment_type, status, created_at
       FROM consultation_requests
       WHERE id = ?`,
[req.params.id]
);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Consultation request not found" });
    }

    res.json(rows[0]);

} catch (err) {
console.error("Error fetching consultation request details:", err);
res.status(500).json({ error: "Internal Server Error", detail: err.message });
}
});

/_ ------------------ ADMIN FETCH REQUESTS/ APPOINTMENTS BY DOJO ------------------ _/
app.get("/admin/appointment-requests/tag/:dojo_tag", async (req, res) => {
try {
const { dojo_tag } = req.params;

    // Get dojo_id from the dojo_tag
    const [dojoRows] = await connection.execute(
      "SELECT dojo_id FROM users WHERE dojo_tag = ? LIMIT 1",
      [dojo_tag]
    );

    if (dojoRows.length === 0) {
      return res.status(404).json({ error: "Dojo not found" });
    }

    const dojoId = dojoRows[0].dojo_id;

    // Fetch consultation requests for this dojo_id
    const [rows] = await connection.execute(
      `SELECT id, dojo_id, parent_name, email_address, contact_details, reason_for_consultation,
              preferred_contact_method, preferred_time_range, number_of_children,
              additional_notes, consent_acknowledged, appointment_type, status, created_at
       FROM consultation_requests
       WHERE dojo_tag = ?
       ORDER BY created_at DESC`,
      [dojo_tag]
    );

    res.json(rows);

} catch (err) {
console.error("Error fetching consultation requests by dojo_tag:", err);
res.status(500).json({ error: "Internal Server Error", detail: err.message });
}
});

/_ ------------------ ADMIN SCHEDULED APPOINTMENTS ------------------ _/
app.post("/admin/scheduled-appointments", async (req, res) => {
try {
const {
consultation_request_id,
dojo_tag,  
 scheduled_date,
start_time,
end_time,
address_text,
meeting_link,
parent_email,
parent_name
} = req.body || {};

    if (!consultation_request_id || !scheduled_date || !start_time || !end_time || !parent_email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert times to 24-hour format for MySQL
    const start_time_24h = convertTo24Hour(start_time);
    const end_time_24h = convertTo24Hour(end_time);

    // Insert the scheduled appointment
    const [result] = await connection.execute(
      `INSERT INTO scheduled_appointments
        (consultation_request_id, dojo_tag, scheduled_date, start_time, end_time, address_text, meeting_link, parent_email, parent_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        consultation_request_id,
        dojo_tag || null,
        scheduled_date,
        start_time_24h,
        end_time_24h,
        address_text || null,
        meeting_link || null,
        parent_email,
        parent_name || null
      ]
    );

    // Update consultation request status to 'upcoming'
    await connection.execute(
      `UPDATE consultation_requests
       SET status = 'upcoming'
       WHERE id = ?`,
      [consultation_request_id]
    );

    // Get appointment type and preferred contact method from consultation request
    const [requestRows] = await connection.execute(
      `SELECT appointment_type, preferred_contact_method FROM consultation_requests WHERE id = ?`,
      [consultation_request_id]
    );
    const appointmentType = requestRows.length > 0 ? requestRows[0].appointment_type : "Online";
    const preferredContactMethod = requestRows.length > 0 ? requestRows[0].preferred_contact_method : "email";

    // Get dojo name for email
    const [dojoRows] = await connection.execute(
      "SELECT dojo_name FROM users WHERE dojo_tag = ? LIMIT 1",
      [dojo_tag]
    );
    const dojoName = dojoRows.length > 0 ? dojoRows[0].dojo_name : "Trial Dojo";

    // Send appropriate appointment email based on type
    // Use original time format for display in email
    const displayTime = start_time; // Keep original format (e.g., "10:00 AM")

    if (address_text != null || address_text != "") {
      await sendPhysicalAppointmentScheduled(
        parent_email,
        parent_name || "Parent",
        scheduled_date,
        displayTime,
        dojoName,
        address_text,
        preferredContactMethod
      );
    } else if (meeting_link) {
      await sendOnlineAppointmentScheduled(
        parent_email,
        parent_name || "Parent",
        scheduled_date,
        displayTime,
        dojoName,
        meeting_link,
        preferredContactMethod
      );
    }

    // Send notification to parent
    const notifTitle = "Appointment Scheduled";
    const notifMessage = `Hi ${parent_name || "Parent"}, your consultation appointment is scheduled for ${scheduled_date} from ${start_time} to ${end_time}.`;

    await connection.execute(
      `INSERT INTO notifications (user_email, title, message, type, event_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        parent_email,
        notifTitle,
        notifMessage,
        "appointment",                  // type
        result.insertId.toString(),     // event_id = appointment id
        "pending"                       // status
      ]
    );

    res.status(201).json({
      id: result.insertId,
      consultation_request_id,
      dojo_tag: dojo_tag || null,
      scheduled_date,
      start_time,
      end_time,
      address_text: address_text || null,
      meeting_link: meeting_link || null,
      parent_email,
      parent_name: parent_name || null,
      created_at: new Date().toISOString(),
    });

} catch (err) {
console.error("Error creating scheduled appointment:", err);
res.status(500).json({ error: "Internal Server Error", detail: err.message });
}
});

app.get("/admin/scheduled-appointments", async (req, res) => {
try {
const { dojo_id } = req.query; // optional query param to filter by dojo

    let query = `
      SELECT sa.id, sa.consultation_request_id, sa.dojo_id,
             sa.scheduled_date, sa.start_time, sa.end_time,
             sa.address_text, sa.meeting_link, sa.created_at,
             cr.parent_name, cr.email_address, cr.contact_details
      FROM scheduled_appointments sa
      JOIN consultation_requests cr
        ON sa.consultation_request_id = cr.id
    `;

    const params = [];

    if (dojo_id) {
      query += " WHERE sa.dojo_id = ?";
      params.push(dojo_id);
    }

    query += " ORDER BY sa.scheduled_date ASC, sa.start_time ASC";

    const [rows] = await connection.execute(query, params);

    res.json(rows);

} catch (err) {
console.error("Error fetching scheduled appointments:", err);
res.status(500).json({ error: "Internal Server Error", detail: err.message });
}
});

/_ ------------------ CANCEL APPOINTMENT ------------------ _/
app.post("/admin/cancel-appointment", async (req, res) => {
try {
const {
appointment_id,
dojo_tag
} = req.body || {};

    if (!appointment_id || !dojo_tag) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get appointment details
    const [appointmentRows] = await connection.execute(
      `SELECT sa.scheduled_date, sa.start_time, sa.parent_email, sa.parent_name, sa.consultation_request_id
       FROM scheduled_appointments sa
       WHERE sa.id = ?`,
      [appointment_id]
    );

    if (appointmentRows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const { scheduled_date, start_time, parent_email, parent_name, consultation_request_id } = appointmentRows[0];

    // Get dojo name and web page URL
    const [dojoRows] = await connection.execute(
      "SELECT dojo_name, dojo_tag FROM users WHERE dojo_tag = ? LIMIT 1",
      [dojo_tag]
    );
    const dojoName = dojoRows.length > 0 ? dojoRows[0].dojo_name : "Trial Dojo";
    const dojoWebPageUrl = dojoRows.length > 0 ? `https://dojoconnect.app/dojo/${dojoRows[0].dojo_tag}` : null;

    // Convert time to 12-hour format for display in email
    const displayTime = convertTo12Hour(start_time);

    // Delete the appointment
    await connection.execute(
      `DELETE FROM scheduled_appointments WHERE id = ?`,
      [appointment_id]
    );

    // Update consultation request status to 'pending'
    await connection.execute(
      `UPDATE consultation_requests SET status = 'pending' WHERE id = ?`,
      [consultation_request_id]
    );

    // Send cancellation email
    await sendAppointmentCancellation(
      parent_email,
      parent_name || "Parent",
      scheduled_date,
      displayTime,
      dojoName,
      dojoWebPageUrl
    );

    res.json({
      success: true,
      message: "Appointment canceled successfully"
    });

} catch (err) {
console.error("Error canceling appointment:", err);
res.status(500).json({ error: "Internal Server Error", detail: err.message });
}
});

/_ ------------------ RESCHEDULE APPOINTMENT ------------------ _/
app.post("/admin/reschedule-appointment", async (req, res) => {
try {
const {
appointment_id,
dojo_tag,
new_scheduled_date,
new_start_time,
new_end_time,
new_address_text,
new_meeting_link
} = req.body || {};

    if (!appointment_id || !dojo_tag || !new_scheduled_date || !new_start_time || !new_end_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert times to 24-hour format for MySQL
    const new_start_time_24h = convertTo24Hour(new_start_time);
    const new_end_time_24h = convertTo24Hour(new_end_time);

    // Get appointment details
    const [appointmentRows] = await connection.execute(
      `SELECT sa.parent_email, sa.parent_name, sa.consultation_request_id
       FROM scheduled_appointments sa
       WHERE sa.id = ?`,
      [appointment_id]
    );

    if (appointmentRows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const { parent_email, parent_name, consultation_request_id } = appointmentRows[0];

    // Get appointment type from consultation request
    const [requestRows] = await connection.execute(
      `SELECT appointment_type FROM consultation_requests WHERE id = ?`,
      [consultation_request_id]
    );
    const appointmentType = requestRows.length > 0 ? requestRows[0].appointment_type : "Online";

    // Get dojo name
    const [dojoRows] = await connection.execute(
      "SELECT dojo_name FROM users WHERE dojo_tag = ? LIMIT 1",
      [dojo_tag]
    );
    const dojoName = dojoRows.length > 0 ? dojoRows[0].dojo_name : "Trial Dojo";

    // Update the appointment with 24-hour format times
    await connection.execute(
      `UPDATE scheduled_appointments
       SET scheduled_date = ?, start_time = ?, end_time = ?, address_text = ?, meeting_link = ?
       WHERE id = ?`,
      [new_scheduled_date, new_start_time_24h, new_end_time_24h, new_address_text || null, new_meeting_link || null, appointment_id]
    );

    // Send appropriate reschedule email based on type
    // Use original time format for display in email
    const displayTime = new_start_time; // Keep original format (e.g., "10:00 AM")

    if (appointmentType === "Physical" && new_address_text) {
      await sendPhysicalAppointmentReschedule(
        parent_email,
        parent_name || "Parent",
        new_scheduled_date,
        displayTime,
        dojoName,
        new_address_text
      );
    } else if (new_meeting_link) {
      await sendOnlineAppointmentReschedule(
        parent_email,
        parent_name || "Parent",
        new_scheduled_date,
        displayTime,
        dojoName,
        new_meeting_link
      );
    }

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment_id,
      new_scheduled_date,
      new_start_time,
      new_end_time
    });

} catch (err) {
console.error("Error rescheduling appointment:", err);
res.status(500).json({ error: "Internal Server Error", detail: err.message });
}
});

/_ ------------------ USERS ------------------ _/
app.post("/users", async (req, res) => {
try {
const { name, email, role, dojo_name, tagline, description } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    let dojoId = null;
    let dojoTag = null;
    let finalDojoName = null;

    if (dojo_name) {
      // check if dojo already exists
      const [dojoRows] = await connection.execute(
        "SELECT id, name, slug FROM dojos WHERE name = ? LIMIT 1",
        [dojo_name]
      );

      if (dojoRows.length > 0) {
        dojoId = dojoRows[0].id;
        finalDojoName = dojoRows[0].name;
        dojoTag = await generateUniqueDojoTag(finalDojoName);
      } else {
        // create new dojo if not exists
        const slug = await generateUniqueSlug(dojo_name);
        const [dojoResult] = await connection.execute(
          "INSERT INTO dojos (name, slug) VALUES (?, ?)",
          [dojo_name, slug]
        );
        dojoId = dojoResult.insertId;
        finalDojoName = dojo_name;
        dojoTag = await generateUniqueDojoTag(finalDojoName);
      }
    }

    // insert user
    const [result] = await connection.execute(

`INSERT INTO users 
   (name, email, role, dojo_id, dojo_name, dojo_tag, stripe_account_id, tagline, description)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
[
name,
email,
role || "student",
dojoId,
finalDojoName,
dojoTag,
"", // stripe_account_id placeholder
tagline || null, // tagline first
description || null // description second
]
);

    res.status(201).json({

id: result.insertId,
name,
email,
role: role || "student",
dojo_id: dojoId,
dojo_name: finalDojoName,
dojo_tag: dojoTag,
tagline: tagline || null,
description: description || null
});
} catch (err) {
console.error("Error creating user:", err.message);
res.status(500).json({ error: "Internal Server Error", detail: err.message });
}
});

/_ ------------------ TEST EMAIL ENDPOINT ------------------ _/
app.post("/test-email", async (req, res) => {
try {
const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const mailOptions = {
      from: `"Dojo Connect" <${process.env.ZOHO_EMAIL || "hello@dojoconnect.app"}>`,
      to: email,
      subject: "Test Email from Trial Dojo API",
      html: `
        <h2>Hello! 👋</h2>
        <p>This is a test email from your Trial Dojo API.</p>
        <p>If you're receiving this email, it means your Zoho Mail integration is working correctly! ✅</p>
        <br/>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Sent at: ${new Date().toLocaleString()}</li>
          <li>From: Trial Dojo API</li>
          <li>SMTP Provider: Zoho Mail</li>
        </ul>
        <br/>
        <p>Best regards,<br/>Trial Dojo Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Test email sent to ${email}`);

    res.json({
      success: true,
      message: `Test email sent successfully to ${email}`,
      timestamp: new Date().toISOString()
    });

} catch (error) {
console.error("❌ Error sending test email:", error.message);
res.status(500).json({
error: "Failed to send test email",
detail: error.message
});
}
});

/_ ------------------ ROOT ------------------ _/
app.get("/", (\_req, res) => res.send("Dojo API is running 🚀"));

/_ ------------------ START ------------------ _/
(async () => {
try {
await initDB(); // ✅ ensure DB is ready before listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
} catch (e) {
console.error("DB init failed:", e);
process.exit(1);
}
})();
