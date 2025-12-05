import "express-async-errors";
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { createObjectCsvWriter } = require("csv-writer");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

import { notFound } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import AppConfig from "./config/AppConfig";
import routes from "./routes/index";

const corsOptions = {
  origin: "https://www.dojoconnect.app",
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json()); // bodyParser not needed

/* ------------------ DB ------------------ */
let connection;
async function initDB() {
  connection = await mysql.createConnection({
    host: AppConfig.BACK_OFFICE_DB_HOST,
    user: AppConfig.BACK_OFFICE_DB_USER,
    password: AppConfig.BACK_OFFICE_DB_PASSWORD,
    database: AppConfig.BACK_OFFICE_DB_NAME,
    // timezone: 'Z', // optional: keep server-side dates in UTC
  });
  console.log("✅ MySQL trial_dojo connected");
}

/* ------------------ Backoffice Utilities (from combine.js) ------------------ */

// Date range utility
function getDateRange(period, start_date = null, end_date = null) {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case "today":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "this_week":
      const firstDay = now.getDate() - now.getDay();
      startDate = new Date(now.setDate(firstDay));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.setDate(firstDay + 6));
      endDate.setHours(23, 59, 59, 999);
      break;
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      break;
    case "custom":
      if (!start_date || !end_date) {
        throw new Error("Custom period requires start_date and end_date");
      }
      startDate = new Date(start_date);
      endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      startDate = new Date(0);
      endDate = new Date();
  }

  return {
    startDate: startDate.toISOString().slice(0, 19).replace("T", " "),
    endDate: endDate.toISOString().slice(0, 19).replace("T", " "),
  };
}

// Export to CSV
async function exportToCSV(data, filename, headers) {
  const exportDir = path.join(__dirname, "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filepath = path.join(exportDir, filename);
  const csvWriter = createObjectCsvWriter({
    path: filepath,
    header: headers,
  });

  await csvWriter.writeRecords(data);
  return filepath;
}

// Export to Excel
async function exportToExcel(data, filename, sheetName = "Sheet1") {
  const exportDir = path.join(__dirname, "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filepath = path.join(exportDir, filename);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map((key) => ({
      header: key.replace(/_/g, " ").toUpperCase(),
      key: key,
      width: 20,
    }));
    worksheet.addRows(data);
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
  }

  await workbook.xlsx.writeFile(filepath);
  return filepath;
}

// Export to PDF
async function exportToPDF(data, filename, title) {
  return new Promise((resolve, reject) => {
    const exportDir = path.join(__dirname, "exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filepath = path.join(exportDir, filename);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Title
    doc.fontSize(20).text(title, { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });
    doc.moveDown(2);

    // Data
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      doc.fontSize(12);
      data.forEach((item, index) => {
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(`Record ${index + 1}:`, { continued: false });
        keys.forEach((key) => {
          doc
            .fontSize(9)
            .font("Helvetica")
            .text(`  ${key}: ${item[key] || "N/A"}`);
        });
        doc.moveDown(0.5);
        if (doc.y > 700) {
          doc.addPage();
        }
      });
    } else {
      doc.text("No data available");
    }

    doc.end();

    stream.on("finish", () => resolve(filepath));
    stream.on("error", reject);
  });
}

// Response formatter
function formatResponse(success, data = null, message = null, error = null) {
  const response = { success };
  if (data !== null) response.data = data;
  if (message !== null) response.message = message;
  if (error !== null) response.error = error;
  return response;
}

// Second database connection pool for backoffice features
const combinePool = mysql.createPool({
  host: AppConfig.MAIN_DB_HOST,
  user: AppConfig.MAIN_DB_USER,
  password: AppConfig.MAIN_DB_PASSWORD,
  database: AppConfig.MAIN_DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test combinePool connection
combinePool
  .getConnection()
  .then((connection) => {
    console.log("✅ MySQL dojoburz_dojoconnect connected");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ dojoburz_dojoconnect connection failed:", err.message);
  });

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL || "hello@dojoconnect.app",
    pass: process.env.ZOHO_PASSWORD || "Connectdojo1!",
  },
  connectionTimeout: 20000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  logger: true,
  debug: true,
  tls: { servername: "smtp.zoho.com" },
});

/* ---------- helpers ---------- */
// slug util
const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// unique slug
async function generateUniqueSlug(name) {
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const [rows] = await connection.execute(
      "SELECT COUNT(*) as count FROM dojos WHERE slug = ?",
      [slug]
    );
    if (rows[0].count === 0) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

const toDojoTag = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

async function generateUniqueDojoTag(name) {
  let baseTag = toDojoTag(name);
  let tag = baseTag;
  let counter = 1;

  while (true) {
    const [rows] = await connection.execute(
      "SELECT COUNT(*) as count FROM users WHERE dojo_tag = ?",
      [tag]
    );
    if (rows[0].count === 0) return tag;
    tag = `${baseTag}_${counter++}`;
  }
}

/** Convert JS Date or ISO string to "YYYY-MM-DD HH:MM:SS"
 *  Use this for INSERTing into DATETIME columns.
 */
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

/** Normalize appointment type to 'physical' | 'online' */
function normalizeApptType(value) {
  if (!value) return "Online"; // default
  return value.toLowerCase() === "physical" ? "Physical" : "Online";
}

/** Convert time from "HH:MM AM/PM" format to "HH:MM:SS" 24-hour format for MySQL */
function convertTo24Hour(time12h) {
  if (!time12h) return null;

  // If already in 24-hour format (HH:MM or HH:MM:SS), return as is
  if (!/AM|PM|am|pm/i.test(time12h)) {
    // Add seconds if not present
    return time12h.includes(":") && time12h.split(":").length === 2
      ? `${time12h}:00`
      : time12h;
  }

  // Parse 12-hour format
  const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i;
  const match = time12h.match(timePattern);

  if (!match) return time12h; // Return as is if pattern doesn't match

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  // Convert to 24-hour format
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}:00`;
}

/** Convert time from "HH:MM:SS" 24-hour format to "HH:MM AM/PM" for display */
function convertTo12Hour(time24h) {
  if (!time24h) return "";

  // If already in 12-hour format, return as is
  if (/AM|PM|am|pm/i.test(time24h)) {
    return time24h;
  }

  const [hoursStr, minutesStr] = time24h.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;

  const period = hours >= 12 ? "PM" : "AM";

  if (hours > 12) {
    hours -= 12;
  } else if (hours === 0) {
    hours = 12;
  }

  return `${hours}:${minutes} ${period}`;
}

/** Helper for Sending Appointment Emails */

// 1. Appointment Request Confirmation Email
async function sendAppointmentRequestConfirmation(
  to,
  parentName,
  appointmentType,
  reason,
  timeRange,
  numberOfChildren,
  dojoName
) {
  const mailOptions = {
    from: `"Dojo Connect" <${
      process.env.ZOHO_EMAIL || "hello@dojoconnect.app"
    }>`,
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
    await transporter.sendMail(mailOptions);
    console.log(`📧 Appointment request confirmation email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}

// 2. Appointment Scheduled Email - Physical Meeting
async function sendPhysicalAppointmentScheduled(
  to,
  parentName,
  scheduledDate,
  startTime,
  dojoName,
  dojoAddress,
  preferredContactMethod
) {
  const formattedDate = new Date(scheduledDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      process.env.ZOHO_EMAIL || "hello@dojoconnect.app"
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
    await transporter.sendMail(mailOptions);
    console.log(`📧 Physical appointment scheduled email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}

// 3. Appointment Scheduled Email - Online
async function sendOnlineAppointmentScheduled(
  to,
  parentName,
  scheduledDate,
  startTime,
  dojoName,
  meetingLink,
  preferredContactMethod
) {
  const formattedDate = new Date(scheduledDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      process.env.ZOHO_EMAIL || "hello@dojoconnect.app"
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
    await transporter.sendMail(mailOptions);
    console.log(`📧 Online appointment scheduled email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}

// 4. Appointment Cancellation Email
async function sendAppointmentCancellation(
  to,
  parentName,
  scheduledDate,
  startTime,
  dojoName,
  dojoWebPageUrl
) {
  const formattedDate = new Date(scheduledDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      process.env.ZOHO_EMAIL || "hello@dojoconnect.app"
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
    await transporter.sendMail(mailOptions);
    console.log(`📧 Appointment cancellation email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}

// 5. Appointment Reschedule Email - Online
async function sendOnlineAppointmentReschedule(
  to,
  parentName,
  newDate,
  newTime,
  dojoName,
  newMeetingLink
) {
  const formattedDate = new Date(newDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      process.env.ZOHO_EMAIL || "hello@dojoconnect.app"
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
    await transporter.sendMail(mailOptions);
    console.log(`📧 Online appointment reschedule email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}

// 6. Appointment Reschedule Email - Physical
async function sendPhysicalAppointmentReschedule(
  to,
  parentName,
  newDate,
  newTime,
  dojoName,
  newAddress
) {
  const formattedDate = new Date(newDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      process.env.ZOHO_EMAIL || "hello@dojoconnect.app"
    }>`,
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
async function sendTrialClassBookingConfirmation(
  to,
  parentName,
  className,
  instructorName,
  appointmentDate,
  numberOfChildren,
  trialFee,
  dojoName
) {
  const formattedDate = new Date(appointmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Dojo Connect" <${
      process.env.ZOHO_EMAIL || "hello@dojoconnect.app"
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
    await transporter.sendMail(mailOptions);
    console.log(`📧 Trial class booking confirmation email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}

/* ------------------ API Routes ------------------ */
app.use("/api", routes);


/* ------------------ EXPORTING/REPORTING (from combine.js) ------------------ */

// Export Users
app.post("/export/users", async (req, res) => {
  try {
    const { format = "csv", filters = {}, include_all = true } = req.body;

    let query =
      "SELECT id, name, email, role, balance, referral_code, created_at, dob, gender, city, subscription_status FROM users WHERE 1=1";
    const params = [];

    if (!include_all && filters) {
      if (filters.role) {
        query += " AND role = ?";
        params.push(filters.role);
      }
      if (filters.email) {
        query += " AND email LIKE ?";
        params.push(`%${filters.email}%`);
      }
    }

    const [users] = await combinePool.query(query, params);

    const timestamp = Date.now();
    const filename = `users_${timestamp}`;
    let filepath;
    let contentType;

    switch (String(format).toLowerCase()) {
      case "csv": {
        const csvHeaders = [
          { id: "id", title: "ID" },
          { id: "name", title: "Name" },
          { id: "email", title: "Email" },
          { id: "role", title: "Role" },
          { id: "balance", title: "Balance" },
          { id: "created_at", title: "Created At" },
        ];
        filepath = await exportToCSV(users, `${filename}.csv`, csvHeaders);
        contentType = "text/csv";
        break;
      }
      case "xlsx":
        filepath = await exportToExcel(users, `${filename}.xlsx`, "Users");
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "pdf":
        filepath = await exportToPDF(
          users,
          `${filename}.pdf`,
          "Users Export Report"
        );
        contentType = "application/pdf";
        break;
      default:
        return res
          .status(400)
          .json(formatResponse(false, null, null, "Invalid format"));
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filepath)}"`
    );

    res.sendFile(filepath, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res
            .status(500)
            .json(formatResponse(false, null, null, "Error downloading file"));
        }
      } else {
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting file:", unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error("Export users error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

/* ------------------ CLASS PROFILE ------------------ */
app.get("/class_profile/:class_uid", async (req, res) => {
  try {
    const { class_uid } = req.params;

    const [classInfo] = await combinePool.query(
      'SELECT * FROM classes WHERE class_uid = ? AND status != "deleted"',
      [class_uid]
    );
    if (classInfo.length === 0) {
      return res
        .status(404)
        .json(formatResponse(false, null, null, "Class not found"));
    }
    const classData = classInfo[0];

    const [schedule] = await combinePool.query(
      "SELECT * FROM class_schedule WHERE class_id = ?",
      [classData.id]
    );

    const [enrolledStudents] = await combinePool.query(
      `
      SELECT s.id, s.full_name, s.email, s.class_id, s.added_by, s.created_at,
             e.enrollment_id, e.parent_email, u.name as parent_name
      FROM students s
      LEFT JOIN enrollments e ON s.class_id = ? AND e.parent_email = s.added_by
      LEFT JOIN users u ON s.added_by = u.email
      WHERE s.class_id = ?
    `,
      [class_uid, class_uid]
    );

    const [attendanceSummary] = await combinePool.query(
      `
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count
      FROM attendance_records
      WHERE class_id = ?
    `,
      [class_uid]
    );

    const [recentAttendance] = await combinePool.query(
      `
      SELECT a.*, u.name as student_name
      FROM attendance_records a
      LEFT JOIN users u ON a.email = u.email
      WHERE a.class_id = ?
      ORDER BY a.attendance_date DESC
      LIMIT 20
    `,
      [class_uid]
    );

    const [enrollmentCount] = await combinePool.query(
      "SELECT COUNT(*) as count FROM enrollments WHERE class_id = ?",
      [class_uid]
    );

    const [recentActivities] = await combinePool.query(
      `
      SELECT e.enrollment_id, e.parent_email, e.created_at, u.name as parent_name,
             'enrollment' as activity_type
      FROM enrollments e
      LEFT JOIN users u ON e.parent_email = u.email
      WHERE e.class_id = ?
      ORDER BY e.created_at DESC
      LIMIT 10
    `,
      [class_uid]
    );

    const response = {
      class_info: classData,
      class_schedule: schedule,
      enrolled_students: enrolledStudents,
      enrollment_count: enrollmentCount[0].count,
      attendance_summary: attendanceSummary[0],
      recent_attendance: recentAttendance,
      subscription_info: {
        subscription_type: classData.subscription,
        price: classData.price,
        capacity: classData.capacity,
        current_enrollments: enrollmentCount[0].count,
        availability: classData.capacity - enrollmentCount[0].count,
      },
      recent_activities: recentActivities,
    };

    res.json(
      formatResponse(true, response, "Class profile retrieved successfully")
    );
  } catch (error) {
    console.error("Class profile error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

/* ------------------ USER PROFILE DETAILED ------------------ */
app.get("/user_profile_detailed/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const [users] = await combinePool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (users.length === 0) {
      return res
        .status(404)
        .json(formatResponse(false, null, null, "User not found"));
    }
    const user = users[0];
    let profileData = { ...user };

    switch (user.role) {
      case "parent": {
        const [enrolledChildren] = await combinePool.query(
          `
          SELECT DISTINCT s.id, s.full_name, s.email, s.class_id, s.created_at
          FROM students s
          WHERE s.added_by = ?
        `,
          [email]
        );

        const [enrolledClasses] = await combinePool.query(
          `
          SELECT c.*, e.enrollment_id, e.created_at as enrolled_at
          FROM enrollments e
          JOIN classes c ON e.class_id = c.class_uid
          WHERE e.parent_email = ? AND c.status = 'active'
        `,
          [email]
        );

        const [subscriptions] = await combinePool.query(
          `
          SELECT cs.*, e.enrollment_id, c.class_name
          FROM children_subscription cs
          JOIN enrollments e ON cs.enrollment_id = e.enrollment_id
          JOIN classes c ON e.class_id = c.class_uid
          WHERE e.parent_email = ?
        `,
          [email]
        );

        const [activities] = await combinePool.query(
          `
          SELECT 'enrollment' as type, created_at, enrollment_id as reference
          FROM enrollments WHERE parent_email = ?
          UNION ALL
          SELECT 'transaction' as type, date as created_at, transaction_title as reference
          FROM transactions WHERE committed_by = ?
          ORDER BY created_at DESC
          LIMIT 20
        `,
          [email, email]
        );

        profileData = {
          ...profileData,
          enrolled_children: enrolledChildren,
          enrolled_classes: enrolledClasses,
          subscription: {
            status: user.subscription_status,
            active_subscriptions: subscriptions,
            trial_ends_at: user.trial_ends_at,
          },
          activities: activities,
        };
        break;
      }
      case "child": {
        const [studentClasses] = await combinePool.query(
          `
          SELECT c.*, s.created_at as enrolled_at
          FROM students s
          JOIN classes c ON s.class_id = c.class_uid
          WHERE s.email = ? AND c.status = 'active'
        `,
          [email]
        );

        const [attendanceSummary] = await combinePool.query(
          `
          SELECT 
            COUNT(*) as total_sessions,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count,
            ROUND((SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_percentage
          FROM attendance_records
          WHERE email = ?
        `,
          [email]
        );

        const [recentSessions] = await combinePool.query(
          `
          SELECT a.*, c.class_name
          FROM attendance_records a
          LEFT JOIN classes c ON a.class_id = c.class_uid
          WHERE a.email = ?
          ORDER BY a.attendance_date DESC
          LIMIT 10
        `,
          [email]
        );

        const [studentActivities] = await combinePool.query(
          `
          SELECT 'attendance' as type, attendance_date as date, status as details, class_id
          FROM attendance_records
          WHERE email = ?
          ORDER BY attendance_date DESC
          LIMIT 20
        `,
          [email]
        );

        profileData = {
          ...profileData,
          enrolled_classes: studentClasses,
          attendance_summary: attendanceSummary[0] || {},
          recent_sessions: recentSessions,
          activity_log: studentActivities,
        };
        break;
      }
      case "instructor": {
        const [assignedClasses] = await combinePool.query(
          `
          SELECT c.*
          FROM classes c
          WHERE c.instructor = ? AND c.status = 'active'
        `,
          [email]
        );

        const [instructorActivities] = await combinePool.query(
          `
          SELECT 'class_created' as type, created_at as date, class_name as details
          FROM classes
          WHERE instructor = ?
          ORDER BY created_at DESC
          LIMIT 20
        `,
          [email]
        );

        const [instructorInfo] = await combinePool.query(
          "SELECT * FROM instructors_tbl WHERE instructor_email = ?",
          [email]
        );

        profileData = {
          ...profileData,
          assigned_classes: assignedClasses,
          activity_log: instructorActivities,
          contact_info: {
            email: user.email,
            phone: user.phone || null,
            city: user.city,
            street: user.street,
          },
          instructor_details: instructorInfo[0] || null,
        };
        break;
      }
      case "admin": {
        const [instructorCount] = await combinePool.query(
          'SELECT COUNT(*) as count FROM users WHERE role = "instructor"'
        );
        const [parentCount] = await combinePool.query(
          'SELECT COUNT(*) as count FROM users WHERE role = "parent"'
        );
        const [studentCount] = await combinePool.query(
          'SELECT COUNT(*) as count FROM users WHERE role = "child"'
        );
        const [classCount] = await combinePool.query(
          'SELECT COUNT(*) as count FROM classes WHERE status = "active"'
        );

        const [assignedTasks] = await combinePool.query(
          "SELECT * FROM tasks WHERE created_by = ? ORDER BY due_date DESC LIMIT 10",
          [email]
        );

        const [ownedClasses] = await combinePool.query(
          'SELECT * FROM classes WHERE owner_email = ? AND status = "active"',
          [email]
        );

        const [events] = await combinePool.query(
          "SELECT * FROM events WHERE created_by = ? AND event_date >= CURDATE() ORDER BY event_date ASC LIMIT 10",
          [email]
        );

        profileData = {
          ...profileData,
          overview_metrics: {
            total_instructors: instructorCount[0].count,
            total_parents: parentCount[0].count,
            total_students: studentCount[0].count,
            total_classes: classCount[0].count,
          },
          assigned_tasks: assignedTasks,
          owned_classes: ownedClasses,
          calendars: events,
          subscription: {
            status: user.subscription_status,
            plan: user.active_sub,
            trial_ends_at: user.trial_ends_at,
            stripe_subscription_id: user.stripe_subscription_id,
          },
        };
        break;
      }
      default:
        return res
          .status(400)
          .json(formatResponse(false, null, null, "Invalid user role"));
    }

    res.json(
      formatResponse(true, profileData, "User profile retrieved successfully")
    );
  } catch (error) {
    console.error("User profile error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Export Classes
app.post("/export/classes", async (req, res) => {
  try {
    const { format = "csv", filters = {}, include_all = true } = req.body;

    let query = `
      SELECT c.id, c.class_uid, c.class_name, c.description, c.instructor, c.level, 
             c.age_group, c.frequency, c.capacity, c.location, c.status, c.price, 
             c.subscription, c.created_at,
             GROUP_CONCAT(CONCAT(cs.day, ' ', cs.start_time, '-', cs.end_time) SEPARATOR ', ') as schedule
      FROM classes c
      LEFT JOIN class_schedule cs ON c.id = cs.class_id
      WHERE 1=1
    `;
    const params = [];

    if (!include_all && filters) {
      if (filters.status) {
        query += " AND c.status = ?";
        params.push(filters.status);
      }
      if (filters.level) {
        query += " AND c.level = ?";
        params.push(filters.level);
      }
    }

    query += " GROUP BY c.id";

    const [classes] = await combinePool.query(query, params);

    const timestamp = Date.now();
    const filename = `classes_${timestamp}`;
    let filepath;
    let contentType;

    switch (String(format).toLowerCase()) {
      case "csv": {
        const csvHeaders = [
          { id: "class_uid", title: "Class UID" },
          { id: "class_name", title: "Class Name" },
          { id: "instructor", title: "Instructor" },
          { id: "level", title: "Level" },
          { id: "capacity", title: "Capacity" },
          { id: "price", title: "Price" },
          { id: "schedule", title: "Schedule" },
        ];
        filepath = await exportToCSV(classes, `${filename}.csv`, csvHeaders);
        contentType = "text/csv";
        break;
      }
      case "xlsx":
        filepath = await exportToExcel(classes, `${filename}.xlsx`, "Classes");
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "pdf":
        filepath = await exportToPDF(
          classes,
          `${filename}.pdf`,
          "Classes Export Report"
        );
        contentType = "application/pdf";
        break;
      default:
        return res
          .status(400)
          .json(formatResponse(false, null, null, "Invalid format"));
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filepath)}"`
    );

    res.sendFile(filepath, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res
            .status(500)
            .json(formatResponse(false, null, null, "Error downloading file"));
        }
      } else {
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting file:", unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error("Export classes error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Export Transactions
app.post("/export/transactions", async (req, res) => {
  try {
    const { format = "csv", filters = {}, include_all = true } = req.body;

    let query = `
      SELECT t.id, t.user_email, t.transaction_title, t.revenue, t.expenses, 
             t.committed_by, t.date, c.class_name
      FROM transactions t
      LEFT JOIN classes c ON t.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (!include_all && filters) {
      if (filters.user_email) {
        query += " AND t.user_email = ?";
        params.push(filters.user_email);
      }
      if (filters.start_date && filters.end_date) {
        query += " AND t.date BETWEEN ? AND ?";
        params.push(filters.start_date, filters.end_date);
      }
    }

    query += " ORDER BY t.date DESC";

    const [transactions] = await combinePool.query(query, params);

    const timestamp = Date.now();
    const filename = `transactions_${timestamp}`;
    let filepath;
    let contentType;

    switch (String(format).toLowerCase()) {
      case "csv": {
        const csvHeaders = [
          { id: "id", title: "ID" },
          { id: "transaction_title", title: "Title" },
          { id: "revenue", title: "Revenue" },
          { id: "expenses", title: "Expenses" },
          { id: "user_email", title: "User Email" },
          { id: "class_name", title: "Class" },
          { id: "date", title: "Date" },
        ];
        filepath = await exportToCSV(
          transactions,
          `${filename}.csv`,
          csvHeaders
        );
        contentType = "text/csv";
        break;
      }
      case "xlsx":
        filepath = await exportToExcel(
          transactions,
          `${filename}.xlsx`,
          "Transactions"
        );
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "pdf":
        filepath = await exportToPDF(
          transactions,
          `${filename}.pdf`,
          "Transactions Export Report"
        );
        contentType = "application/pdf";
        break;
      default:
        return res
          .status(400)
          .json(formatResponse(false, null, null, "Invalid format"));
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filepath)}"`
    );

    res.sendFile(filepath, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res
            .status(500)
            .json(formatResponse(false, null, null, "Error downloading file"));
        }
      } else {
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting file:", unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error("Export transactions error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Export Attendance
app.post("/export/attendance", async (req, res) => {
  try {
    const { format = "csv", filters = {}, include_all = true } = req.body;

    let query = `
      SELECT a.id, a.class_id, c.class_name, a.email, u.name as student_name, 
             a.attendance_date, a.status, a.created_at
      FROM attendance_records a
      LEFT JOIN classes c ON a.class_id = c.class_uid
      LEFT JOIN users u ON a.email = u.email
      WHERE 1=1
    `;
    const params = [];

    if (!include_all && filters) {
      if (filters.class_id) {
        query += " AND a.class_id = ?";
        params.push(filters.class_id);
      }
      if (filters.email) {
        query += " AND a.email = ?";
        params.push(filters.email);
      }
      if (filters.start_date && filters.end_date) {
        query += " AND a.attendance_date BETWEEN ? AND ?";
        params.push(filters.start_date, filters.end_date);
      }
    }

    query += " ORDER BY a.attendance_date DESC";

    const [attendance] = await combinePool.query(query, params);

    const timestamp = Date.now();
    const filename = `attendance_${timestamp}`;
    let filepath;
    let contentType;

    switch (String(format).toLowerCase()) {
      case "csv": {
        const csvHeaders = [
          { id: "id", title: "ID" },
          { id: "class_name", title: "Class" },
          { id: "student_name", title: "Student" },
          { id: "email", title: "Email" },
          { id: "attendance_date", title: "Date" },
          { id: "status", title: "Status" },
        ];
        filepath = await exportToCSV(attendance, `${filename}.csv`, csvHeaders);
        contentType = "text/csv";
        break;
      }
      case "xlsx":
        filepath = await exportToExcel(
          attendance,
          `${filename}.xlsx`,
          "Attendance"
        );
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "pdf":
        filepath = await exportToPDF(
          attendance,
          `${filename}.pdf`,
          "Attendance Export Report"
        );
        contentType = "application/pdf";
        break;
      default:
        return res
          .status(400)
          .json(formatResponse(false, null, null, "Invalid format"));
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filepath)}"`
    );

    res.sendFile(filepath, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res
            .status(500)
            .json(formatResponse(false, null, null, "Error downloading file"));
        }
      } else {
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting file:", unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error("Export attendance error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Export Enrollments
app.post("/export/enrollments", async (req, res) => {
  try {
    const { format = "csv", filters = {}, include_all = true } = req.body;

    let query = `
      SELECT e.id, e.enrollment_id, e.class_id, c.class_name, e.parent_email, 
             u.name as parent_name, e.created_at,
             ec.child_name, ec.child_email, ec.experience_level
      FROM enrollments e
      LEFT JOIN classes c ON e.class_id = c.class_uid
      LEFT JOIN users u ON e.parent_email = u.email
      LEFT JOIN enrolled_children ec ON e.enrollment_id = ec.enrollment_id
      WHERE 1=1
    `;
    const params = [];

    if (!include_all && filters) {
      if (filters.class_id) {
        query += " AND e.class_id = ?";
        params.push(filters.class_id);
      }
      if (filters.parent_email) {
        query += " AND e.parent_email = ?";
        params.push(filters.parent_email);
      }
    }

    query += " ORDER BY e.created_at DESC";

    const [enrollments] = await combinePool.query(query, params);

    const timestamp = Date.now();
    const filename = `enrollments_${timestamp}`;
    let filepath;
    let contentType;

    switch (String(format).toLowerCase()) {
      case "csv": {
        const csvHeaders = [
          { id: "enrollment_id", title: "Enrollment ID" },
          { id: "class_name", title: "Class" },
          { id: "parent_name", title: "Parent" },
          { id: "parent_email", title: "Parent Email" },
          { id: "child_name", title: "Child Name" },
          { id: "child_email", title: "Child Email" },
          { id: "created_at", title: "Enrolled At" },
        ];
        filepath = await exportToCSV(
          enrollments,
          `${filename}.csv`,
          csvHeaders
        );
        contentType = "text/csv";
        break;
      }
      case "xlsx":
        filepath = await exportToExcel(
          enrollments,
          `${filename}.xlsx`,
          "Enrollments"
        );
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "pdf":
        filepath = await exportToPDF(
          enrollments,
          `${filename}.pdf`,
          "Enrollments Export Report"
        );
        contentType = "application/pdf";
        break;
      default:
        return res
          .status(400)
          .json(formatResponse(false, null, null, "Invalid format"));
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filepath)}"`
    );

    res.sendFile(filepath, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res
            .status(500)
            .json(formatResponse(false, null, null, "Error downloading file"));
        }
      } else {
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting file:", unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error("Export enrollments error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

/* ------------------ TRIAL CLASS BOOKINGS CREATE ------------------ */

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
      trial_fee,
    } = req.body;

    // Validate required fields
    if (
      !class_id ||
      !parent_name ||
      !email ||
      !phone ||
      !appointment_date ||
      !dojo_tag
    ) {
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
        trial_fee || 0,
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

/* ------------------ FETCH TRIAL CLASS BOOKINGS BY DOJOTAG ------------------ */
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

/* ------------------ FETCH TRIAL CLASS BOOKINGS DETAILS BY ID ------------------ */
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

/* ------------------ CREATE A NEW APPOINTMENT REQUESTS ------------------ */
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

    if (
      !parent_name ||
      !email_address ||
      !contact_details ||
      consent_acknowledged === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!dojo_tag || !dojo_email) {
      return res
        .status(400)
        .json({ error: "dojo_tag and dojo_email are required" });
    }

    // normalize values
    const children = Number.isFinite(Number(number_of_children))
      ? Number(number_of_children)
      : null;
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
        safeStatus,
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
      [
        dojo_email,
        title,
        message,
        "consultation_request",
        result.insertId.toString(),
        "pending",
      ]
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
    res
      .status(500)
      .json({ error: "Internal Server Error", detail: err.message });
  }
});

/* ------------------ FETCH ALL APPOINTMENT REQUESTS ------------------ */
app.get("/appointment-requests", async (_req, res) => {
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
    res
      .status(500)
      .json({ error: "Internal Server Error", detail: err.message });
  }
});

/* ------------------ FETCH APPOINTMENT REQUEST BY ID ------------------ */
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
    res
      .status(500)
      .json({ error: "Internal Server Error", detail: err.message });
  }
});

/* ------------------ ADMIN FETCH REQUESTS/ APPOINTMENTS BY DOJO ------------------ */
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
    res
      .status(500)
      .json({ error: "Internal Server Error", detail: err.message });
  }
});

/* ------------------ ADMIN SCHEDULED APPOINTMENTS ------------------ */
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
      parent_name,
    } = req.body || {};

    if (
      !consultation_request_id ||
      !scheduled_date ||
      !start_time ||
      !end_time ||
      !parent_email
    ) {
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
        parent_name || null,
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
    const appointmentType =
      requestRows.length > 0 ? requestRows[0].appointment_type : "Online";
    const preferredContactMethod =
      requestRows.length > 0
        ? requestRows[0].preferred_contact_method
        : "email";

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
    const notifMessage = `Hi ${
      parent_name || "Parent"
    }, your consultation appointment is scheduled for ${scheduled_date} from ${start_time} to ${end_time}.`;

    await connection.execute(
      `INSERT INTO notifications (user_email, title, message, type, event_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        parent_email,
        notifTitle,
        notifMessage,
        "appointment", // type
        result.insertId.toString(), // event_id = appointment id
        "pending", // status
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
    res
      .status(500)
      .json({ error: "Internal Server Error", detail: err.message });
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
    res
      .status(500)
      .json({ error: "Internal Server Error", detail: err.message });
  }
});

/* ------------------ CANCEL APPOINTMENT ------------------ */
app.post("/admin/cancel-appointment", async (req, res) => {
  try {
    const { appointment_id, dojo_tag } = req.body || {};

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

    const {
      scheduled_date,
      start_time,
      parent_email,
      parent_name,
      consultation_request_id,
    } = appointmentRows[0];

    // Get dojo name and web page URL
    const [dojoRows] = await connection.execute(
      "SELECT dojo_name, dojo_tag FROM users WHERE dojo_tag = ? LIMIT 1",
      [dojo_tag]
    );
    const dojoName = dojoRows.length > 0 ? dojoRows[0].dojo_name : "Trial Dojo";
    const dojoWebPageUrl =
      dojoRows.length > 0
        ? `https://dojoconnect.app/dojo/${dojoRows[0].dojo_tag}`
        : null;

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
      message: "Appointment canceled successfully",
    });
  } catch (err) {
    console.error("Error canceling appointment:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", detail: err.message });
  }
});

/* ------------------ RESCHEDULE APPOINTMENT ------------------ */
app.post("/admin/reschedule-appointment", async (req, res) => {
  try {
    const {
      appointment_id,
      dojo_tag,
      new_scheduled_date,
      new_start_time,
      new_end_time,
      new_address_text,
      new_meeting_link,
    } = req.body || {};

    if (
      !appointment_id ||
      !dojo_tag ||
      !new_scheduled_date ||
      !new_start_time ||
      !new_end_time
    ) {
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

    const { parent_email, parent_name, consultation_request_id } =
      appointmentRows[0];

    // Get appointment type from consultation request
    const [requestRows] = await connection.execute(
      `SELECT appointment_type FROM consultation_requests WHERE id = ?`,
      [consultation_request_id]
    );
    const appointmentType =
      requestRows.length > 0 ? requestRows[0].appointment_type : "Online";

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
      [
        new_scheduled_date,
        new_start_time_24h,
        new_end_time_24h,
        new_address_text || null,
        new_meeting_link || null,
        appointment_id,
      ]
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
      new_end_time,
    });
  } catch (err) {
    console.error("Error rescheduling appointment:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", detail: err.message });
  }
});

/* ------------------ USERS ------------------ */
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
        description || null, // description second
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
      description: description || null,
    });
  } catch (err) {
    console.error("Error creating user:", err.message);
    res
      .status(500)
      .json({ error: "Internal Server Error", detail: err.message });
  }
});

/* ------------------ ADMIN (from combine.js) ------------------ */

// Create User
app.post("/admin/users/create", async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      password,
      referred_by,
      save_as_draft = false,
    } = req.body;

    if (!name || !email || !role) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            null,
            "Name, email, and role are required"
          )
        );
    }

    const [existing] = await combinePool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json(formatResponse(false, null, null, "User already exists"));
    }

    const bcrypt = require("bcrypt");
    const plainPassword = password || Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const [result] = await combinePool.query(
      `INSERT INTO users (name, email, role, password, referred_by, referral_code, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        email,
        role,
        hashedPassword,
        referred_by || null,
        "DOJ" + Math.floor(Math.random() * 10000),
      ]
    );

    res.json(
      formatResponse(
        true,
        {
          user_id: result.insertId,
          email: email,
          referral_code: null,
          plain_password: plainPassword,
          saved_as_draft: save_as_draft,
        },
        "User created successfully"
      )
    );
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

/* ------------------ METRICS (from combine.js) ------------------ */

// Revenue Metrics
app.post("/metrics/revenue", async (req, res) => {
  try {
    const { period = "all", start_date, end_date, class_id } = req.body;
    let dateFilter = "";
    let params = [];
    if (period !== "all") {
      const dateRange = getDateRange(period, start_date, end_date);
      dateFilter = "AND t.date BETWEEN ? AND ?";
      params.push(dateRange.startDate, dateRange.endDate);
    }
    let classFilter = "";
    if (class_id) {
      classFilter = "AND t.class_id = ?";
      params.push(class_id);
    }

    const [summary] = await combinePool.query(
      `
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(expenses) as total_expenses,
        SUM(revenue - expenses) as net_revenue,
        COUNT(*) as transaction_count
      FROM transactions t
      WHERE 1=1 ${dateFilter} ${classFilter}
    `,
      params
    );

    const [byClass] = await combinePool.query(
      `
      SELECT c.class_name, c.class_uid, SUM(t.revenue) as revenue, COUNT(*) as enrollments
      FROM transactions t
      JOIN classes c ON t.class_id = c.id
      WHERE t.revenue > 0 ${dateFilter} ${classFilter}
      GROUP BY c.id
      ORDER BY revenue DESC
    `,
      params
    );

    const [timeSeries] = await combinePool.query(
      `
      SELECT DATE(date) as date, SUM(revenue) as revenue, SUM(expenses) as expenses
      FROM transactions t
      WHERE 1=1 ${dateFilter} ${classFilter}
      GROUP BY DATE(date)
      ORDER BY date ASC
    `,
      params
    );

    res.json(
      formatResponse(
        true,
        {
          summary: summary[0],
          by_class: byClass,
          time_series: timeSeries,
          period: period,
          date_range:
            period !== "all"
              ? getDateRange(period, start_date, end_date)
              : null,
        },
        "Revenue metrics retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Revenue metrics error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Enrollment Metrics
app.post("/metrics/enrollment", async (req, res) => {
  try {
    const { period = "all", start_date, end_date } = req.body;
    let dateFilter = "";
    let params = [];
    if (period !== "all") {
      const dateRange = getDateRange(period, start_date, end_date);
      dateFilter = "AND created_at BETWEEN ? AND ?";
      params.push(dateRange.startDate, dateRange.endDate);
    }

    const [newUsers] = await combinePool.query(
      `
      SELECT role, COUNT(*) as count
      FROM users
      WHERE 1=1 ${dateFilter}
      GROUP BY role
    `,
      params
    );

    const [activeUsers] = await combinePool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE subscription_status IN ('active', 'trialing')
    `);

    const [newEnrollments] = await combinePool.query(
      `
      SELECT COUNT(*) as count
      FROM enrollments
      WHERE 1=1 ${dateFilter}
    `,
      params
    );

    const [enrollmentsByClass] = await combinePool.query(
      `
      SELECT c.class_name, c.class_uid, COUNT(e.id) as enrollment_count
      FROM enrollments e
      JOIN classes c ON e.class_id = c.class_uid
      WHERE 1=1 ${dateFilter}
      GROUP BY c.class_uid
      ORDER BY enrollment_count DESC
    `,
      params
    );

    const [timeSeries] = await combinePool.query(
      `
      SELECT DATE(created_at) as date, COUNT(*) as new_users
      FROM users
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
      params
    );

    res.json(
      formatResponse(
        true,
        {
          new_users: newUsers,
          active_users: activeUsers[0].count,
          new_enrollments: newEnrollments[0].count,
          enrollments_by_class: enrollmentsByClass,
          time_series: timeSeries,
          period: period,
        },
        "Enrollment metrics retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Enrollment metrics error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Attendance Metrics
app.post("/metrics/attendance", async (req, res) => {
  try {
    const { period = "all", start_date, end_date, class_id } = req.body;
    let dateFilter = "";
    let params = [];
    if (period !== "all") {
      const dateRange = getDateRange(period, start_date, end_date);
      dateFilter = "AND attendance_date BETWEEN ? AND ?";
      params.push(dateRange.startDate, dateRange.endDate);
    }
    let classFilter = "";
    if (class_id) {
      classFilter = "AND class_id = ?";
      params.push(class_id);
    }

    const [summary] = await combinePool.query(
      `
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count,
        ROUND((SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
      FROM attendance_records
      WHERE 1=1 ${dateFilter} ${classFilter}
    `,
      params
    );

    const [byClass] = await combinePool.query(
      `
      SELECT 
        a.class_id,
        c.class_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
        ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
      FROM attendance_records a
      LEFT JOIN classes c ON a.class_id = c.class_uid
      WHERE 1=1 ${dateFilter} ${classFilter}
      GROUP BY a.class_id
      ORDER BY attendance_rate DESC
    `,
      params
    );

    const [attendanceSeries] = await combinePool.query(
      `
      SELECT 
        DATE(attendance_date) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM attendance_records
      WHERE 1=1 ${dateFilter} ${classFilter}
      GROUP BY DATE(attendance_date)
      ORDER BY date ASC
    `,
      params
    );

    res.json(
      formatResponse(
        true,
        {
          summary: summary[0],
          by_class: byClass,
          time_series: attendanceSeries,
          period: period,
        },
        "Attendance metrics retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Attendance metrics error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Subscription Metrics
app.post("/metrics/subscriptions", async (req, res) => {
  try {
    const { period = "all", start_date, end_date } = req.body; // period not used here

    const [userSubscriptions] = await combinePool.query(`
      SELECT 
        subscription_status,
        COUNT(*) as count
      FROM users
      WHERE subscription_status IS NOT NULL
      GROUP BY subscription_status
    `);

    const [byPlan] = await combinePool.query(`
      SELECT 
        active_sub as plan,
        COUNT(*) as count
      FROM users
      WHERE active_sub IS NOT NULL
      GROUP BY active_sub
    `);

    const [childrenSubs] = await combinePool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM children_subscription
      GROUP BY status
    `);

    const [revenue] = await combinePool.query(`
      SELECT SUM(t.revenue) as total_subscription_revenue
      FROM transactions t
      WHERE t.transaction_title LIKE '%subscription%' OR t.transaction_title LIKE '%enrollment%'
    `);

    res.json(
      formatResponse(
        true,
        {
          user_subscriptions: userSubscriptions,
          by_plan: byPlan,
          children_subscriptions: childrenSubs,
          total_revenue: revenue[0].total_subscription_revenue || 0,
        },
        "Subscription metrics retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Subscription metrics error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Overview Dashboard Metrics
app.post("/metrics/overview", async (req, res) => {
  try {
    const { period = "this_month", start_date, end_date } = req.body;
    let dateFilter = "";
    let params = [];
    if (period !== "all") {
      const dateRange = getDateRange(period, start_date, end_date);
      dateFilter = "AND created_at BETWEEN ? AND ?";
      params.push(dateRange.startDate, dateRange.endDate);
    }

    const [userCounts] = await combinePool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END) as instructors,
        SUM(CASE WHEN role = 'parent' THEN 1 ELSE 0 END) as parents,
        SUM(CASE WHEN role = 'child' THEN 1 ELSE 0 END) as students
      FROM users
    `);

    const [classCounts] = await combinePool.query(`
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_classes
      FROM classes
    `);

    const [revenueSummary] = await combinePool.query(`
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(expenses) as total_expenses,
        SUM(revenue - expenses) as net_revenue
      FROM transactions
    `);

    const [recentEnrollments] = await combinePool.query(
      `
      SELECT COUNT(*) as count
      FROM enrollments
      WHERE 1=1 ${dateFilter}
    `,
      params
    );

    const [activeSubs] = await combinePool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE subscription_status IN ('active', 'trialing')
    `);

    const [feedbackCount] = await combinePool.query(
      "SELECT COUNT(*) as count FROM feedback"
    );
    const [waitlistCount] = await combinePool.query(
      "SELECT COUNT(*) as count FROM waitlist"
    );

    res.json(
      formatResponse(
        true,
        {
          users: userCounts[0],
          classes: classCounts[0],
          revenue: revenueSummary[0],
          recent_enrollments: recentEnrollments[0].count,
          active_subscriptions: activeSubs[0].count,
          feedback_count: feedbackCount[0].count,
          waitlist_count: waitlistCount[0].count,
          period: period,
        },
        "Overview metrics retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Overview metrics error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Edit User Profile
app.put("/admin/users/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;
    delete updates.password;
    delete updates.email;
    delete updates.id;
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json(formatResponse(false, null, null, "No valid fields to update"));
    }
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), email];
    await combinePool.query(
      `UPDATE users SET ${fields} WHERE email = ?`,
      values
    );
    res.json(formatResponse(true, null, "User updated successfully"));
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Activate/Deactivate User
app.patch("/admin/users/:email/status", async (req, res) => {
  try {
    const { email } = req.params;
    const { status } = req.body;
    if (!status || !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            null,
            "Valid status required (active/inactive)"
          )
        );
    }
    await combinePool.query(
      "UPDATE users SET subscription_status = ? WHERE email = ?",
      [status, email]
    );
    res.json(
      formatResponse(
        true,
        null,
        `User ${status === "active" ? "activated" : "deactivated"} successfully`
      )
    );
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Soft Delete User
app.delete("/admin/users/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { confirm } = req.body;
    if (!confirm) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            null,
            "Confirmation required for deletion"
          )
        );
    }
    await combinePool.query(
      "UPDATE users SET subscription_status = ? WHERE email = ?",
      ["deleted", email]
    );
    res.json(formatResponse(true, null, "User soft deleted successfully"));
  } catch (error) {
    console.error("Soft delete user error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Hard Delete User
app.delete("/admin/users/:email/hard", async (req, res) => {
  try {
    const { email } = req.params;
    const { confirm, admin_password } = req.body;
    if (!confirm || !admin_password) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            null,
            "Confirmation and admin password required"
          )
        );
    }
    await combinePool.query("DELETE FROM users WHERE email = ?", [email]);
    res.json(formatResponse(true, null, "User permanently deleted"));
  } catch (error) {
    console.error("Hard delete user error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Create Class
app.post("/admin/classes/create", async (req, res) => {
  try {
    const {
      owner_email,
      class_name,
      description,
      instructor,
      level,
      age_group,
      frequency,
      capacity,
      location,
      street_address,
      city,
      subscription,
      price,
      schedule,
    } = req.body;
    if (!owner_email || !class_name || !capacity) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            null,
            "Owner email, class name, and capacity are required"
          )
        );
    }
    const class_uid = Math.random().toString(36).substr(2, 10);
    const [result] = await combinePool.query(
      `INSERT INTO classes (class_uid, owner_email, class_name, description, instructor, level, 
       age_group, frequency, capacity, location, street_address, city, subscription, price, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [
        class_uid,
        owner_email,
        class_name,
        description,
        instructor,
        level,
        age_group,
        frequency,
        capacity,
        location,
        street_address,
        city,
        subscription,
        price || 0,
      ]
    );
    const class_id = result.insertId;
    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      const scheduleValues = schedule.map((s) => [
        class_id,
        s.day || null,
        s.start_time,
        s.end_time,
        s.schedule_date || null,
      ]);
      await combinePool.query(
        "INSERT INTO class_schedule (class_id, day, start_time, end_time, schedule_date) VALUES ?",
        [scheduleValues]
      );
    }
    res.json(
      formatResponse(
        true,
        { class_id, class_uid, class_name },
        "Class created successfully"
      )
    );
  } catch (error) {
    console.error("Create class error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Edit Class
app.put("/admin/classes/:class_uid", async (req, res) => {
  try {
    const { class_uid } = req.params;
    const updates = req.body;
    delete updates.class_uid;
    delete updates.id;
    delete updates.schedule;
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json(formatResponse(false, null, null, "No valid fields to update"));
    }
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), class_uid];
    await combinePool.query(
      `UPDATE classes SET ${fields} WHERE class_uid = ?`,
      values
    );
    res.json(formatResponse(true, null, "Class updated successfully"));
  } catch (error) {
    console.error("Update class error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Soft Delete Class
app.delete("/admin/classes/:class_uid", async (req, res) => {
  try {
    const { class_uid } = req.params;
    const { confirm } = req.body;
    if (!confirm) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            null,
            "Confirmation required for deletion"
          )
        );
    }
    await combinePool.query(
      "UPDATE classes SET status = ? WHERE class_uid = ?",
      ["deleted", class_uid]
    );
    res.json(formatResponse(true, null, "Class soft deleted successfully"));
  } catch (error) {
    console.error("Soft delete class error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Enroll Student in Class
app.post("/admin/classes/:class_uid/enroll", async (req, res) => {
  try {
    const { class_uid } = req.params;
    const { parent_email, child_name, child_email, experience_level } =
      req.body;
    if (!parent_email || !child_email) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            null,
            "Parent email and child email are required"
          )
        );
    }
    const enrollment_id =
      "enr_" +
      Date.now().toString(16) +
      Math.random().toString(16).substr(2, 5);
    await combinePool.query(
      "INSERT INTO enrollments (enrollment_id, class_id, parent_email, created_at) VALUES (?, ?, ?, NOW())",
      [enrollment_id, class_uid, parent_email]
    );
    if (child_name) {
      await combinePool.query(
        "INSERT INTO enrolled_children (enrollment_id, child_name, child_email, experience_level) VALUES (?, ?, ?, ?)",
        [enrollment_id, child_name, child_email, experience_level || "beginner"]
      );
    }
    await combinePool.query(
      `
      INSERT INTO parents (email, enrollment_id, class_id) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        enrollment_id = CONCAT(enrollment_id, ',', VALUES(enrollment_id)),
        class_id = CONCAT(class_id, ',', VALUES(class_id))
    `,
      [parent_email, enrollment_id, class_uid]
    );
    res.json(
      formatResponse(true, { enrollment_id }, "Student enrolled successfully")
    );
  } catch (error) {
    console.error("Enroll student error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Unenroll Student from Class
app.delete(
  "/admin/classes/:class_uid/unenroll/:student_email",
  async (req, res) => {
    try {
      const { class_uid, student_email } = req.params;
      await combinePool.query(
        "DELETE FROM students WHERE email = ? AND class_id = ?",
        [student_email, class_uid]
      );
      await combinePool.query(
        "DELETE FROM enrollments WHERE class_id = ? AND parent_email IN (SELECT added_by FROM students WHERE email = ?)",
        [class_uid, student_email]
      );
      res.json(formatResponse(true, null, "Student unenrolled successfully"));
    } catch (error) {
      console.error("Unenroll student error:", error);
      res.status(500).json(formatResponse(false, null, null, error.message));
    }
  }
);

// Export Class Attendance
app.post("/admin/classes/:class_uid/attendance/export", async (req, res) => {
  try {
    const { class_uid } = req.params;
    const { format = "csv" } = req.body;
    const [attendance] = await combinePool.query(
      `
      SELECT a.id, a.email, u.name as student_name, a.attendance_date, a.status, a.created_at
      FROM attendance_records a
      LEFT JOIN users u ON a.email = u.email
      WHERE a.class_id = ?
      ORDER BY a.attendance_date DESC
    `,
      [class_uid]
    );
    const timestamp = Date.now();
    const filename = `class_${class_uid}_attendance_${timestamp}`;
    let filepath;
    let contentType;
    switch (String(format).toLowerCase()) {
      case "csv": {
        const csvHeaders = [
          { id: "student_name", title: "Student Name" },
          { id: "email", title: "Email" },
          { id: "attendance_date", title: "Date" },
          { id: "status", title: "Status" },
        ];
        filepath = await exportToCSV(attendance, `${filename}.csv`, csvHeaders);
        contentType = "text/csv";
        break;
      }
      case "xlsx":
        filepath = await exportToExcel(
          attendance,
          `${filename}.xlsx`,
          "Attendance"
        );
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "pdf":
        filepath = await exportToPDF(
          attendance,
          `${filename}.pdf`,
          `Class Attendance Report - ${class_uid}`
        );
        contentType = "application/pdf";
        break;
      default:
        return res
          .status(400)
          .json(formatResponse(false, null, null, "Invalid format"));
    }
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filepath)}"`
    );
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res
            .status(500)
            .json(formatResponse(false, null, null, "Error downloading file"));
        }
      } else {
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting file:", unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error("Export class attendance error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

/* ------------------ TEST EMAIL ENDPOINT ------------------ */
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
      from: `"Dojo Connect" <${
        process.env.ZOHO_EMAIL || "hello@dojoconnect.app"
      }>`,
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error sending test email:", error.message);
    res.status(500).json({
      error: "Failed to send test email",
      detail: error.message,
    });
  }
});

/* ------------------ ROOT ------------------ */
app.get("/", (_req, res) => res.send("Dojo API is running 🚀"));

/* ------------------ NOTIFICATIONS (from combine.js) ------------------ */

// Get User Notifications
app.get("/notifications/:user_email", async (req, res) => {
  try {
    const { user_email } = req.params;
    const { limit = 50, unread_only = false } = req.query;
    let query = "SELECT * FROM notifications WHERE user_email = ?";
    const params = [user_email];
    if (unread_only === "true") {
      query += " AND is_read = 0";
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(parseInt(limit));
    const [notifications] = await combinePool.query(query, params);
    const [unreadCount] = await combinePool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_email = ? AND is_read = 0",
      [user_email]
    );
    res.json(
      formatResponse(
        true,
        {
          notifications,
          unread_count: unreadCount[0].count,
          total: notifications.length,
        },
        "Notifications retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Create Notification
app.post("/notifications", async (req, res) => {
  try {
    const {
      user_email,
      title,
      message,
      type = "message",
      event_id = null,
    } = req.body;
    if (!user_email || !title || !message) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            null,
            "User email, title, and message are required"
          )
        );
    }
    const [result] = await combinePool.query(
      `INSERT INTO notifications (user_email, title, message, type, event_id, is_read, created_at, status)
       VALUES (?, ?, ?, ?, ?, 0, NOW(), 'pending')`,
      [user_email, title, message, type, event_id]
    );
    res.json(
      formatResponse(
        true,
        { notification_id: result.insertId, user_email, title },
        "Notification created successfully"
      )
    );
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Mark Notification as Read
app.patch("/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    await combinePool.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ?",
      [id]
    );
    res.json(formatResponse(true, null, "Notification marked as read"));
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Mark All Notifications as Read
app.patch("/notifications/read_all/:user_email", async (req, res) => {
  try {
    const { user_email } = req.params;
    const [result] = await combinePool.query(
      "UPDATE notifications SET is_read = 1 WHERE user_email = ? AND is_read = 0",
      [user_email]
    );
    res.json(
      formatResponse(
        true,
        { updated_count: result.affectedRows },
        "All notifications marked as read"
      )
    );
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Delete Notification
app.delete("/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await combinePool.query("DELETE FROM notifications WHERE id = ?", [id]);
    res.json(formatResponse(true, null, "Notification deleted successfully"));
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

/* ------------------ ROOT (merged) ------------------ */
app.get("/backoffice", (req, res) => {
  res.json({
    success: true,
    message: "DojoConnect Backoffice API",
    version: "1.0.0",
    endpoints: {
      exporting: [
        "POST /export/users",
        "POST /export/classes",
        "POST /export/transactions",
        "POST /export/attendance",
        "POST /export/enrollments",
      ],
      profiles: [
        "GET /class_profile/:class_uid",
        "GET /user_profile_detailed/:email",
      ],
      admin: [
        "POST /admin/users/create",
        "PUT /admin/users/:email",
        "PATCH /admin/users/:email/status",
        "DELETE /admin/users/:email",
        "DELETE /admin/users/:email/hard",
        "POST /admin/classes/create",
        "PUT /admin/classes/:class_uid",
        "DELETE /admin/classes/:class_uid",
        "POST /admin/classes/:class_uid/enroll",
        "DELETE /admin/classes/:class_uid/unenroll/:student_email",
        "POST /admin/classes/:class_uid/attendance/export",
      ],
      metrics: [
        "POST /metrics/revenue",
        "POST /metrics/enrollment",
        "POST /metrics/attendance",
        "POST /metrics/subscriptions",
        "POST /metrics/overview",
      ],
      notifications: [
        "GET /notifications/:user_email",
        "POST /notifications",
        "PATCH /notifications/:id/read",
        "PATCH /notifications/read_all/:user_email",
        "DELETE /notifications/:id",
      ],
    },
  });
});

/* ----------------------- TEst Endpoint */
app.get("/test", (req, res) => {
  res.json({
    name: "Korede",
    profession: "Elewa with Spaghetti sauce",
  });
});

// catch all 404 routes → JSON
app.use(notFound);

/* ------------------ ERROR HANDLING ------------------ */
// register AFTER all routes
app.use(errorHandler);

/* ------------------ START ------------------ */
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

