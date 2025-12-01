const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { createObjectCsvWriter } = require('csv-writer');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATABASE CONNECTION ====================
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Trodpen2022*??-23',
  database: 'dojoburz_dojoconnect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✓ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
  });

// ==================== UTILITY FUNCTIONS ====================

// Date range utility
function getDateRange(period, start_date = null, end_date = null) {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'this_week':
      const firstDay = now.getDate() - now.getDay();
      startDate = new Date(now.setDate(firstDay));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.setDate(firstDay + 6));
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'custom':
      if (!start_date || !end_date) {
        throw new Error('Custom period requires start_date and end_date');
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
    startDate: startDate.toISOString().slice(0, 19).replace('T', ' '),
    endDate: endDate.toISOString().slice(0, 19).replace('T', ' ')
  };
}

// Export to CSV
async function exportToCSV(data, filename, headers) {
  const exportDir = path.join(__dirname, 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filepath = path.join(exportDir, filename);
  const csvWriter = createObjectCsvWriter({
    path: filepath,
    header: headers
  });

  await csvWriter.writeRecords(data);
  return filepath;
}

// Export to Excel
async function exportToExcel(data, filename, sheetName = 'Sheet1') {
  const exportDir = path.join(__dirname, 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filepath = path.join(exportDir, filename);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map(key => ({
      header: key.replace(/_/g, ' ').toUpperCase(),
      key: key,
      width: 20
    }));
    worksheet.addRows(data);
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  await workbook.xlsx.writeFile(filepath);
  return filepath;
}

// Export to PDF
async function exportToPDF(data, filename, title) {
  return new Promise((resolve, reject) => {
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filepath = path.join(exportDir, filename);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Title
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Data
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      
      doc.fontSize(12);
      data.forEach((item, index) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`Record ${index + 1}:`, { continued: false });
        keys.forEach(key => {
          doc.fontSize(9).font('Helvetica').text(`  ${key}: ${item[key] || 'N/A'}`);
        });
        doc.moveDown(0.5);
        
        if (doc.y > 700) {
          doc.addPage();
        }
      });
    } else {
      doc.text('No data available');
    }

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
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

// ==================== FEATURE 1: EXPORTING/REPORTING ENDPOINTS ====================

// Export Users
app.post('/export/users', async (req, res) => {
  try {
    const { format = 'csv', filters = {}, include_all = true } = req.body;
    
    let query = 'SELECT id, name, email, role, balance, referral_code, created_at, dob, gender, city, subscription_status FROM users WHERE 1=1';
    const params = [];

    if (!include_all && filters) {
      if (filters.role) {
        query += ' AND role = ?';
        params.push(filters.role);
      }
      if (filters.email) {
        query += ' AND email LIKE ?';
        params.push(`%${filters.email}%`);
      }
    }

    const [users] = await pool.query(query, params);

    const timestamp = Date.now();
    const filename = `users_${timestamp}`;
    let filepath;
    let contentType;

    switch (format.toLowerCase()) {
      case 'csv':
        const csvHeaders = [
          { id: 'id', title: 'ID' },
          { id: 'name', title: 'Name' },
          { id: 'email', title: 'Email' },
          { id: 'role', title: 'Role' },
          { id: 'balance', title: 'Balance' },
          { id: 'created_at', title: 'Created At' }
        ];
        filepath = await exportToCSV(users, `${filename}.csv`, csvHeaders);
        contentType = 'text/csv';
        break;
      case 'xlsx':
        filepath = await exportToExcel(users, `${filename}.xlsx`, 'Users');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        filepath = await exportToPDF(users, `${filename}.pdf`, 'Users Export Report');
        contentType = 'application/pdf';
        break;
      default:
        return res.status(400).json(formatResponse(false, null, null, 'Invalid format'));
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filepath)}"`);
    
    // Send file and delete after
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json(formatResponse(false, null, null, 'Error downloading file'));
        }
      } else {
        // Delete file after successful download
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Export Classes
app.post('/export/classes', async (req, res) => {
  try {
    const { format = 'csv', filters = {}, include_all = true } = req.body;
    
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
        query += ' AND c.status = ?';
        params.push(filters.status);
      }
      if (filters.level) {
        query += ' AND c.level = ?';
        params.push(filters.level);
      }
    }

    query += ' GROUP BY c.id';

    const [classes] = await pool.query(query, params);

    const timestamp = Date.now();
    const filename = `classes_${timestamp}`;
    let filepath;
    let contentType;

    switch (format.toLowerCase()) {
      case 'csv':
        const csvHeaders = [
          { id: 'class_uid', title: 'Class UID' },
          { id: 'class_name', title: 'Class Name' },
          { id: 'instructor', title: 'Instructor' },
          { id: 'level', title: 'Level' },
          { id: 'capacity', title: 'Capacity' },
          { id: 'price', title: 'Price' },
          { id: 'schedule', title: 'Schedule' }
        ];
        filepath = await exportToCSV(classes, `${filename}.csv`, csvHeaders);
        contentType = 'text/csv';
        break;
      case 'xlsx':
        filepath = await exportToExcel(classes, `${filename}.xlsx`, 'Classes');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        filepath = await exportToPDF(classes, `${filename}.pdf`, 'Classes Export Report');
        contentType = 'application/pdf';
        break;
      default:
        return res.status(400).json(formatResponse(false, null, null, 'Invalid format'));
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filepath)}"`);
    
    // Send file and delete after
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json(formatResponse(false, null, null, 'Error downloading file'));
        }
      } else {
        // Delete file after successful download
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error('Export classes error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Export Transactions
app.post('/export/transactions', async (req, res) => {
  try {
    const { format = 'csv', filters = {}, include_all = true } = req.body;
    
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
        query += ' AND t.user_email = ?';
        params.push(filters.user_email);
      }
      if (filters.start_date && filters.end_date) {
        query += ' AND t.date BETWEEN ? AND ?';
        params.push(filters.start_date, filters.end_date);
      }
    }

    query += ' ORDER BY t.date DESC';

    const [transactions] = await pool.query(query, params);

    const timestamp = Date.now();
    const filename = `transactions_${timestamp}`;
    let filepath;
    let contentType;

    switch (format.toLowerCase()) {
      case 'csv':
        const csvHeaders = [
          { id: 'id', title: 'ID' },
          { id: 'transaction_title', title: 'Title' },
          { id: 'revenue', title: 'Revenue' },
          { id: 'expenses', title: 'Expenses' },
          { id: 'user_email', title: 'User Email' },
          { id: 'class_name', title: 'Class' },
          { id: 'date', title: 'Date' }
        ];
        filepath = await exportToCSV(transactions, `${filename}.csv`, csvHeaders);
        contentType = 'text/csv';
        break;
      case 'xlsx':
        filepath = await exportToExcel(transactions, `${filename}.xlsx`, 'Transactions');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        filepath = await exportToPDF(transactions, `${filename}.pdf`, 'Transactions Export Report');
        contentType = 'application/pdf';
        break;
      default:
        return res.status(400).json(formatResponse(false, null, null, 'Invalid format'));
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filepath)}"`);
    
    // Send file and delete after
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json(formatResponse(false, null, null, 'Error downloading file'));
        }
      } else {
        // Delete file after successful download
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error('Export transactions error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Export Attendance
app.post('/export/attendance', async (req, res) => {
  try {
    const { format = 'csv', filters = {}, include_all = true } = req.body;
    
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
        query += ' AND a.class_id = ?';
        params.push(filters.class_id);
      }
      if (filters.email) {
        query += ' AND a.email = ?';
        params.push(filters.email);
      }
      if (filters.start_date && filters.end_date) {
        query += ' AND a.attendance_date BETWEEN ? AND ?';
        params.push(filters.start_date, filters.end_date);
      }
    }

    query += ' ORDER BY a.attendance_date DESC';

    const [attendance] = await pool.query(query, params);

    const timestamp = Date.now();
    const filename = `attendance_${timestamp}`;
    let filepath;
    let contentType;

    switch (format.toLowerCase()) {
      case 'csv':
        const csvHeaders = [
          { id: 'id', title: 'ID' },
          { id: 'class_name', title: 'Class' },
          { id: 'student_name', title: 'Student' },
          { id: 'email', title: 'Email' },
          { id: 'attendance_date', title: 'Date' },
          { id: 'status', title: 'Status' }
        ];
        filepath = await exportToCSV(attendance, `${filename}.csv`, csvHeaders);
        contentType = 'text/csv';
        break;
      case 'xlsx':
        filepath = await exportToExcel(attendance, `${filename}.xlsx`, 'Attendance');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        filepath = await exportToPDF(attendance, `${filename}.pdf`, 'Attendance Export Report');
        contentType = 'application/pdf';
        break;
      default:
        return res.status(400).json(formatResponse(false, null, null, 'Invalid format'));
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filepath)}"`);
    
    // Send file and delete after
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json(formatResponse(false, null, null, 'Error downloading file'));
        }
      } else {
        // Delete file after successful download
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Export Enrollments
app.post('/export/enrollments', async (req, res) => {
  try {
    const { format = 'csv', filters = {}, include_all = true } = req.body;
    
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
        query += ' AND e.class_id = ?';
        params.push(filters.class_id);
      }
      if (filters.parent_email) {
        query += ' AND e.parent_email = ?';
        params.push(filters.parent_email);
      }
    }

    query += ' ORDER BY e.created_at DESC';

    const [enrollments] = await pool.query(query, params);

    const timestamp = Date.now();
    const filename = `enrollments_${timestamp}`;
    let filepath;
    let contentType;

    switch (format.toLowerCase()) {
      case 'csv':
        const csvHeaders = [
          { id: 'enrollment_id', title: 'Enrollment ID' },
          { id: 'class_name', title: 'Class' },
          { id: 'parent_name', title: 'Parent' },
          { id: 'parent_email', title: 'Parent Email' },
          { id: 'child_name', title: 'Child Name' },
          { id: 'child_email', title: 'Child Email' },
          { id: 'created_at', title: 'Enrolled At' }
        ];
        filepath = await exportToCSV(enrollments, `${filename}.csv`, csvHeaders);
        contentType = 'text/csv';
        break;
      case 'xlsx':
        filepath = await exportToExcel(enrollments, `${filename}.xlsx`, 'Enrollments');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        filepath = await exportToPDF(enrollments, `${filename}.pdf`, 'Enrollments Export Report');
        contentType = 'application/pdf';
        break;
      default:
        return res.status(400).json(formatResponse(false, null, null, 'Invalid format'));
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filepath)}"`);
    
    // Send file and delete after
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json(formatResponse(false, null, null, 'Error downloading file'));
        }
      } else {
        // Delete file after successful download
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error('Export enrollments error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// ==================== FEATURE 2: CLASS PROFILE ENDPOINT ====================

app.get('/class_profile/:class_uid', async (req, res) => {
  try {
    const { class_uid } = req.params;

    // Get class info
    const [classInfo] = await pool.query(
      'SELECT * FROM classes WHERE class_uid = ? AND status != "deleted"',
      [class_uid]
    );

    if (classInfo.length === 0) {
      return res.status(404).json(formatResponse(false, null, null, 'Class not found'));
    }

    const classData = classInfo[0];

    // Get class schedule
    const [schedule] = await pool.query(
      'SELECT * FROM class_schedule WHERE class_id = ?',
      [classData.id]
    );

    // Get enrolled students
    const [enrolledStudents] = await pool.query(`
      SELECT s.id, s.full_name, s.email, s.class_id, s.added_by, s.created_at,
             e.enrollment_id, e.parent_email, u.name as parent_name
      FROM students s
      LEFT JOIN enrollments e ON s.class_id = ? AND e.parent_email = s.added_by
      LEFT JOIN users u ON s.added_by = u.email
      WHERE s.class_id = ?
    `, [class_uid, class_uid]);

    // Get attendance summary
    const [attendanceSummary] = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count
      FROM attendance_records
      WHERE class_id = ?
    `, [class_uid]);

    // Get recent attendance records
    const [recentAttendance] = await pool.query(`
      SELECT a.*, u.name as student_name
      FROM attendance_records a
      LEFT JOIN users u ON a.email = u.email
      WHERE a.class_id = ?
      ORDER BY a.attendance_date DESC
      LIMIT 20
    `, [class_uid]);

    // Get subscription info
    const [enrollmentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM enrollments WHERE class_id = ?',
      [class_uid]
    );

    // Get recent activities (enrollments)
    const [recentActivities] = await pool.query(`
      SELECT e.enrollment_id, e.parent_email, e.created_at, u.name as parent_name,
             'enrollment' as activity_type
      FROM enrollments e
      LEFT JOIN users u ON e.parent_email = u.email
      WHERE e.class_id = ?
      ORDER BY e.created_at DESC
      LIMIT 10
    `, [class_uid]);

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
        availability: classData.capacity - enrollmentCount[0].count
      },
      recent_activities: recentActivities
    };

    res.json(formatResponse(true, response, 'Class profile retrieved successfully'));
  } catch (error) {
    console.error('Class profile error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// ==================== FEATURE 3: USER PROFILE - ROLE SPECIFIC ====================

app.get('/user_profile_detailed/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Get user basic info
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json(formatResponse(false, null, null, 'User not found'));
    }

    const user = users[0];
    let profileData = { ...user };

    switch (user.role) {
      case 'parent':
        // Get enrolled children
        const [enrolledChildren] = await pool.query(`
          SELECT DISTINCT s.id, s.full_name, s.email, s.class_id, s.created_at
          FROM students s
          WHERE s.added_by = ?
        `, [email]);

        // Get enrolled classes
        const [enrolledClasses] = await pool.query(`
          SELECT c.*, e.enrollment_id, e.created_at as enrolled_at
          FROM enrollments e
          JOIN classes c ON e.class_id = c.class_uid
          WHERE e.parent_email = ? AND c.status = 'active'
        `, [email]);

        // Get subscription info
        const [subscriptions] = await pool.query(`
          SELECT cs.*, e.enrollment_id, c.class_name
          FROM children_subscription cs
          JOIN enrollments e ON cs.enrollment_id = e.enrollment_id
          JOIN classes c ON e.class_id = c.class_uid
          WHERE e.parent_email = ?
        `, [email]);

        // Get recent activities
        const [activities] = await pool.query(`
          SELECT 'enrollment' as type, created_at, enrollment_id as reference
          FROM enrollments WHERE parent_email = ?
          UNION ALL
          SELECT 'transaction' as type, date as created_at, transaction_title as reference
          FROM transactions WHERE committed_by = ?
          ORDER BY created_at DESC
          LIMIT 20
        `, [email, email]);

        profileData = {
          ...profileData,
          enrolled_children: enrolledChildren,
          enrolled_classes: enrolledClasses,
          subscription: {
            status: user.subscription_status,
            active_subscriptions: subscriptions,
            trial_ends_at: user.trial_ends_at
          },
          activities: activities
        };
        break;

      case 'child':
        // Get enrolled classes
        const [studentClasses] = await pool.query(`
          SELECT c.*, s.created_at as enrolled_at
          FROM students s
          JOIN classes c ON s.class_id = c.class_uid
          WHERE s.email = ? AND c.status = 'active'
        `, [email]);

        // Get attendance summary
        const [attendanceSummary] = await pool.query(`
          SELECT 
            COUNT(*) as total_sessions,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count,
            ROUND((SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_percentage
          FROM attendance_records
          WHERE email = ?
        `, [email]);

        // Get recent attendance
        const [recentSessions] = await pool.query(`
          SELECT a.*, c.class_name
          FROM attendance_records a
          LEFT JOIN classes c ON a.class_id = c.class_uid
          WHERE a.email = ?
          ORDER BY a.attendance_date DESC
          LIMIT 10
        `, [email]);

        // Get activity log
        const [studentActivities] = await pool.query(`
          SELECT 'attendance' as type, attendance_date as date, status as details, class_id
          FROM attendance_records
          WHERE email = ?
          ORDER BY attendance_date DESC
          LIMIT 20
        `, [email]);

        profileData = {
          ...profileData,
          enrolled_classes: studentClasses,
          attendance_summary: attendanceSummary[0] || {},
          recent_sessions: recentSessions,
          activity_log: studentActivities
        };
        break;

      case 'instructor':
        // Get assigned classes
        const [assignedClasses] = await pool.query(`
          SELECT c.*
          FROM classes c
          WHERE c.instructor = ? AND c.status = 'active'
        `, [email]);

        // Get activity log
        const [instructorActivities] = await pool.query(`
          SELECT 'class_created' as type, created_at as date, class_name as details
          FROM classes
          WHERE instructor = ?
          ORDER BY created_at DESC
          LIMIT 20
        `, [email]);

        // Get instructor info
        const [instructorInfo] = await pool.query(
          'SELECT * FROM instructors_tbl WHERE instructor_email = ?',
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
            street: user.street
          },
          instructor_details: instructorInfo[0] || null
        };
        break;

      case 'admin':
        // Get overview metrics
        const [instructorCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "instructor"');
        const [parentCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "parent"');
        const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "child"');
        const [classCount] = await pool.query('SELECT COUNT(*) as count FROM classes WHERE status = "active"');

        // Get assigned tasks
        const [assignedTasks] = await pool.query(
          'SELECT * FROM tasks WHERE created_by = ? ORDER BY due_date DESC LIMIT 10',
          [email]
        );

        // Get owned classes (as dojo owner)
        const [ownedClasses] = await pool.query(
          'SELECT * FROM classes WHERE owner_email = ? AND status = "active"',
          [email]
        );

        // Get upcoming events
        const [events] = await pool.query(
          'SELECT * FROM events WHERE created_by = ? AND event_date >= CURDATE() ORDER BY event_date ASC LIMIT 10',
          [email]
        );

        profileData = {
          ...profileData,
          overview_metrics: {
            total_instructors: instructorCount[0].count,
            total_parents: parentCount[0].count,
            total_students: studentCount[0].count,
            total_classes: classCount[0].count
          },
          assigned_tasks: assignedTasks,
          owned_classes: ownedClasses,
          calendars: events,
          subscription: {
            status: user.subscription_status,
            plan: user.active_sub,
            trial_ends_at: user.trial_ends_at,
            stripe_subscription_id: user.stripe_subscription_id
          }
        };
        break;

      default:
        return res.status(400).json(formatResponse(false, null, null, 'Invalid user role'));
    }

    res.json(formatResponse(true, profileData, 'User profile retrieved successfully'));
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// ==================== FEATURE 4: ADMIN CRUD & FLOWS ====================

// Create User
app.post('/admin/users/create', async (req, res) => {
  try {
    const { name, email, role, password, referred_by, save_as_draft = false } = req.body;

    // Validation
    if (!name || !email || !role) {
      return res.status(400).json(formatResponse(false, null, null, 'Name, email, and role are required'));
    }

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json(formatResponse(false, null, null, 'User already exists'));
    }

    // Generate referral code
    const referralCode = 'DOJ' + Math.floor(Math.random() * 10000);

    // Hash password if provided, otherwise generate one
    const bcrypt = require('bcrypt');
    const plainPassword = password || Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (name, email, role, password, referred_by, referral_code, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [name, email, role, hashedPassword, referred_by || null, referralCode]
    );

    res.json(formatResponse(true, {
      user_id: result.insertId,
      email: email,
      referral_code: referralCode,
      plain_password: plainPassword,
      saved_as_draft: save_as_draft
    }, 'User created successfully'));
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Edit User Profile
app.put('/admin/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated this way
    delete updates.password;
    delete updates.email;
    delete updates.id;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json(formatResponse(false, null, null, 'No valid fields to update'));
    }

    // Build update query
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(email);

    await pool.query(`UPDATE users SET ${fields} WHERE email = ?`, values);

    res.json(formatResponse(true, null, 'User updated successfully'));
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Activate/Deactivate User
app.patch('/admin/users/:email/status', async (req, res) => {
  try {
    const { email } = req.params;
    const { status } = req.body; // 'active' or 'inactive'

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json(formatResponse(false, null, null, 'Valid status required (active/inactive)'));
    }

    // For this schema, we might need to add a status column, or use a different approach
    // For now, we'll use a simple flag or update subscription_status
    await pool.query(
      'UPDATE users SET subscription_status = ? WHERE email = ?',
      [status, email]
    );

    res.json(formatResponse(true, null, `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`));
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Soft Delete User
app.delete('/admin/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json(formatResponse(false, null, null, 'Confirmation required for deletion'));
    }

    // Soft delete by setting a flag or moving to deleted table
    // For this implementation, we'll update subscription_status
    await pool.query(
      'UPDATE users SET subscription_status = ? WHERE email = ?',
      ['deleted', email]
    );

    res.json(formatResponse(true, null, 'User soft deleted successfully'));
  } catch (error) {
    console.error('Soft delete user error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Hard Delete User
app.delete('/admin/users/:email/hard', async (req, res) => {
  try {
    const { email } = req.params;
    const { confirm, admin_password } = req.body;

    if (!confirm || !admin_password) {
      return res.status(400).json(formatResponse(false, null, null, 'Confirmation and admin password required'));
    }

    // In production, verify admin password here

    // Delete user permanently
    await pool.query('DELETE FROM users WHERE email = ?', [email]);

    res.json(formatResponse(true, null, 'User permanently deleted'));
  } catch (error) {
    console.error('Hard delete user error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Create Class
app.post('/admin/classes/create', async (req, res) => {
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
      schedule // Array of schedule objects: [{day, start_time, end_time, schedule_date}]
    } = req.body;

    // Validation
    if (!owner_email || !class_name || !capacity) {
      return res.status(400).json(formatResponse(false, null, null, 'Owner email, class name, and capacity are required'));
    }

    // Generate class UID
    const class_uid = Math.random().toString(36).substr(2, 10);

    // Insert class
    const [result] = await pool.query(
      `INSERT INTO classes (class_uid, owner_email, class_name, description, instructor, level, 
       age_group, frequency, capacity, location, street_address, city, subscription, price, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [class_uid, owner_email, class_name, description, instructor, level, age_group, frequency, 
       capacity, location, street_address, city, subscription, price || 0]
    );

    const class_id = result.insertId;

    // Insert schedule if provided
    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      const scheduleValues = schedule.map(s => [
        class_id,
        s.day || null,
        s.start_time,
        s.end_time,
        s.schedule_date || null
      ]);

      await pool.query(
        'INSERT INTO class_schedule (class_id, day, start_time, end_time, schedule_date) VALUES ?',
        [scheduleValues]
      );
    }

    res.json(formatResponse(true, {
      class_id,
      class_uid,
      class_name
    }, 'Class created successfully'));
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Edit Class
app.put('/admin/classes/:class_uid', async (req, res) => {
  try {
    const { class_uid } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated this way
    delete updates.class_uid;
    delete updates.id;
    delete updates.schedule; // Schedule handled separately

    if (Object.keys(updates).length === 0) {
      return res.status(400).json(formatResponse(false, null, null, 'No valid fields to update'));
    }

    // Build update query
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(class_uid);

    await pool.query(`UPDATE classes SET ${fields} WHERE class_uid = ?`, values);

    res.json(formatResponse(true, null, 'Class updated successfully'));
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Soft Delete Class
app.delete('/admin/classes/:class_uid', async (req, res) => {
  try {
    const { class_uid } = req.params;
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json(formatResponse(false, null, null, 'Confirmation required for deletion'));
    }

    await pool.query(
      'UPDATE classes SET status = ? WHERE class_uid = ?',
      ['deleted', class_uid]
    );

    res.json(formatResponse(true, null, 'Class soft deleted successfully'));
  } catch (error) {
    console.error('Soft delete class error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Enroll Student in Class
app.post('/admin/classes/:class_uid/enroll', async (req, res) => {
  try {
    const { class_uid } = req.params;
    const { parent_email, child_name, child_email, experience_level } = req.body;

    if (!parent_email || !child_email) {
      return res.status(400).json(formatResponse(false, null, null, 'Parent email and child email are required'));
    }

    // Generate enrollment ID
    const enrollment_id = 'enr_' + Date.now().toString(16) + Math.random().toString(16).substr(2, 5);

    // Insert enrollment
    await pool.query(
      'INSERT INTO enrollments (enrollment_id, class_id, parent_email, created_at) VALUES (?, ?, ?, NOW())',
      [enrollment_id, class_uid, parent_email]
    );

    // Add child to enrolled_children if child info provided
    if (child_name) {
      await pool.query(
        'INSERT INTO enrolled_children (enrollment_id, child_name, child_email, experience_level) VALUES (?, ?, ?, ?)',
        [enrollment_id, child_name, child_email, experience_level || 'beginner']
      );
    }

    // Update parent's enrollment tracking
    await pool.query(`
      INSERT INTO parents (email, enrollment_id, class_id) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        enrollment_id = CONCAT(enrollment_id, ',', VALUES(enrollment_id)),
        class_id = CONCAT(class_id, ',', VALUES(class_id))
    `, [parent_email, enrollment_id, class_uid]);

    res.json(formatResponse(true, { enrollment_id }, 'Student enrolled successfully'));
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Unenroll Student from Class
app.delete('/admin/classes/:class_uid/unenroll/:student_email', async (req, res) => {
  try {
    const { class_uid, student_email } = req.params;

    // Delete from students table
    await pool.query(
      'DELETE FROM students WHERE email = ? AND class_id = ?',
      [student_email, class_uid]
    );

    // Delete enrollments
    await pool.query(
      'DELETE FROM enrollments WHERE class_id = ? AND parent_email IN (SELECT added_by FROM students WHERE email = ?)',
      [class_uid, student_email]
    );

    res.json(formatResponse(true, null, 'Student unenrolled successfully'));
  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Export Class Attendance
app.post('/admin/classes/:class_uid/attendance/export', async (req, res) => {
  try {
    const { class_uid } = req.params;
    const { format = 'csv' } = req.body;

    const [attendance] = await pool.query(`
      SELECT a.id, a.email, u.name as student_name, a.attendance_date, a.status, a.created_at
      FROM attendance_records a
      LEFT JOIN users u ON a.email = u.email
      WHERE a.class_id = ?
      ORDER BY a.attendance_date DESC
    `, [class_uid]);

    const timestamp = Date.now();
    const filename = `class_${class_uid}_attendance_${timestamp}`;
    let filepath;
    let contentType;

    switch (format.toLowerCase()) {
      case 'csv':
        const csvHeaders = [
          { id: 'student_name', title: 'Student Name' },
          { id: 'email', title: 'Email' },
          { id: 'attendance_date', title: 'Date' },
          { id: 'status', title: 'Status' }
        ];
        filepath = await exportToCSV(attendance, `${filename}.csv`, csvHeaders);
        contentType = 'text/csv';
        break;
      case 'xlsx':
        filepath = await exportToExcel(attendance, `${filename}.xlsx`, 'Attendance');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        filepath = await exportToPDF(attendance, `${filename}.pdf`, `Class Attendance Report - ${class_uid}`);
        contentType = 'application/pdf';
        break;
      default:
        return res.status(400).json(formatResponse(false, null, null, 'Invalid format'));
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filepath)}"`);
    
    // Send file and delete after
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json(formatResponse(false, null, null, 'Error downloading file'));
        }
      } else {
        // Delete file after successful download
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
    });
  } catch (error) {
    console.error('Export class attendance error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// ==================== FEATURE 5: METRICS/ANALYTICS ====================

// Revenue Metrics
app.post('/metrics/revenue', async (req, res) => {
  try {
    const { period = 'all', start_date, end_date, class_id } = req.body;

    let dateFilter = '';
    let params = [];

    if (period !== 'all') {
      const dateRange = getDateRange(period, start_date, end_date);
      dateFilter = 'AND t.date BETWEEN ? AND ?';
      params.push(dateRange.startDate, dateRange.endDate);
    }

    let classFilter = '';
    if (class_id) {
      classFilter = 'AND t.class_id = ?';
      params.push(class_id);
    }

    // Total revenue and expenses
    const [summary] = await pool.query(`
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(expenses) as total_expenses,
        SUM(revenue - expenses) as net_revenue,
        COUNT(*) as transaction_count
      FROM transactions t
      WHERE 1=1 ${dateFilter} ${classFilter}
    `, params);

    // Revenue by class
    const [byClass] = await pool.query(`
      SELECT c.class_name, c.class_uid, SUM(t.revenue) as revenue, COUNT(*) as enrollments
      FROM transactions t
      JOIN classes c ON t.class_id = c.id
      WHERE t.revenue > 0 ${dateFilter} ${classFilter}
      GROUP BY c.id
      ORDER BY revenue DESC
    `, params);

    // Time series data (daily)
    const [timeSeries] = await pool.query(`
      SELECT DATE(date) as date, SUM(revenue) as revenue, SUM(expenses) as expenses
      FROM transactions t
      WHERE 1=1 ${dateFilter} ${classFilter}
      GROUP BY DATE(date)
      ORDER BY date ASC
    `, params);

    res.json(formatResponse(true, {
      summary: summary[0],
      by_class: byClass,
      time_series: timeSeries,
      period: period,
      date_range: period !== 'all' ? getDateRange(period, start_date, end_date) : null
    }, 'Revenue metrics retrieved successfully'));
  } catch (error) {
    console.error('Revenue metrics error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Enrollment Metrics
app.post('/metrics/enrollment', async (req, res) => {
  try {
    const { period = 'all', start_date, end_date } = req.body;

    let dateFilter = '';
    let params = [];

    if (period !== 'all') {
      const dateRange = getDateRange(period, start_date, end_date);
      dateFilter = 'AND created_at BETWEEN ? AND ?';
      params.push(dateRange.startDate, dateRange.endDate);
    }

    // New users by role
    const [newUsers] = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      WHERE 1=1 ${dateFilter}
      GROUP BY role
    `, params);

    // Total active users
    const [activeUsers] = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE subscription_status IN ('active', 'trialing')
    `);

    // New enrollments
    const [newEnrollments] = await pool.query(`
      SELECT COUNT(*) as count
      FROM enrollments
      WHERE 1=1 ${dateFilter}
    `, params);

    // Enrollments by class
    const [enrollmentsByClass] = await pool.query(`
      SELECT c.class_name, c.class_uid, COUNT(e.id) as enrollment_count
      FROM enrollments e
      JOIN classes c ON e.class_id = c.class_uid
      WHERE 1=1 ${dateFilter}
      GROUP BY c.class_uid
      ORDER BY enrollment_count DESC
    `, params);

    // Time series
    const [timeSeries] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as new_users
      FROM users
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, params);

    res.json(formatResponse(true, {
      new_users: newUsers,
      active_users: activeUsers[0].count,
      new_enrollments: newEnrollments[0].count,
      enrollments_by_class: enrollmentsByClass,
      time_series: timeSeries,
      period: period
    }, 'Enrollment metrics retrieved successfully'));
  } catch (error) {
    console.error('Enrollment metrics error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Attendance Metrics
app.post('/metrics/attendance', async (req, res) => {
  try {
    const { period = 'all', start_date, end_date, class_id } = req.body;

    let dateFilter = '';
    let params = [];

    if (period !== 'all') {
      const dateRange = getDateRange(period, start_date, end_date);
      dateFilter = 'AND attendance_date BETWEEN ? AND ?';
      params.push(dateRange.startDate, dateRange.endDate);
    }

    let classFilter = '';
    if (class_id) {
      classFilter = 'AND class_id = ?';
      params.push(class_id);
    }

    // Overall attendance summary
    const [summary] = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count,
        ROUND((SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
      FROM attendance_records
      WHERE 1=1 ${dateFilter} ${classFilter}
    `, params);

    // Attendance by class
    const [byClass] = await pool.query(`
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
    `, params);

    // Time series
    const [timeSeries] = await pool.query(`
      SELECT 
        DATE(attendance_date) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM attendance_records
      WHERE 1=1 ${dateFilter} ${classFilter}
      GROUP BY DATE(attendance_date)
      ORDER BY date ASC
    `, params);

    res.json(formatResponse(true, {
      summary: summary[0],
      by_class: byClass,
      time_series: timeSeries,
      period: period
    }, 'Attendance metrics retrieved successfully'));
  } catch (error) {
    console.error('Attendance metrics error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Subscription Metrics
app.post('/metrics/subscriptions', async (req, res) => {
  try {
    const { period = 'all', start_date, end_date } = req.body;

    // User subscriptions status
    const [userSubscriptions] = await pool.query(`
      SELECT 
        subscription_status,
        COUNT(*) as count
      FROM users
      WHERE subscription_status IS NOT NULL
      GROUP BY subscription_status
    `);

    // Active subscriptions by plan
    const [byPlan] = await pool.query(`
      SELECT 
        active_sub as plan,
        COUNT(*) as count
      FROM users
      WHERE active_sub IS NOT NULL
      GROUP BY active_sub
    `);

    // Children subscriptions
    const [childrenSubs] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM children_subscription
      GROUP BY status
    `);

    // Revenue from subscriptions
    const [revenue] = await pool.query(`
      SELECT SUM(t.revenue) as total_subscription_revenue
      FROM transactions t
      WHERE t.transaction_title LIKE '%subscription%' OR t.transaction_title LIKE '%enrollment%'
    `);

    res.json(formatResponse(true, {
      user_subscriptions: userSubscriptions,
      by_plan: byPlan,
      children_subscriptions: childrenSubs,
      total_revenue: revenue[0].total_subscription_revenue || 0
    }, 'Subscription metrics retrieved successfully'));
  } catch (error) {
    console.error('Subscription metrics error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Overview Dashboard Metrics
app.post('/metrics/overview', async (req, res) => {
  try {
    const { period = 'this_month', start_date, end_date } = req.body;

    let dateFilter = '';
    let params = [];

    if (period !== 'all') {
      const dateRange = getDateRange(period, start_date, end_date);
      dateFilter = 'AND created_at BETWEEN ? AND ?';
      params.push(dateRange.startDate, dateRange.endDate);
    }

    // User counts
    const [userCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END) as instructors,
        SUM(CASE WHEN role = 'parent' THEN 1 ELSE 0 END) as parents,
        SUM(CASE WHEN role = 'child' THEN 1 ELSE 0 END) as students
      FROM users
    `);

    // Class counts
    const [classCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_classes
      FROM classes
    `);

    // Revenue summary
    const [revenueSummary] = await pool.query(`
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(expenses) as total_expenses,
        SUM(revenue - expenses) as net_revenue
      FROM transactions
    `);

    // Recent enrollments
    const [recentEnrollments] = await pool.query(`
      SELECT COUNT(*) as count
      FROM enrollments
      WHERE 1=1 ${dateFilter}
    `, params);

    // Active subscriptions
    const [activeSubs] = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE subscription_status IN ('active', 'trialing')
    `);

    // Feedback count
    const [feedbackCount] = await pool.query(`
      SELECT COUNT(*) as count FROM feedback
    `);

    // Waitlist count
    const [waitlistCount] = await pool.query(`
      SELECT COUNT(*) as count FROM waitlist
    `);

    res.json(formatResponse(true, {
      users: userCounts[0],
      classes: classCounts[0],
      revenue: revenueSummary[0],
      recent_enrollments: recentEnrollments[0].count,
      active_subscriptions: activeSubs[0].count,
      feedback_count: feedbackCount[0].count,
      waitlist_count: waitlistCount[0].count,
      period: period
    }, 'Overview metrics retrieved successfully'));
  } catch (error) {
    console.error('Overview metrics error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// ==================== FEATURE 6: NOTIFICATIONS SYSTEM ====================

// Get User Notifications
app.get('/notifications/:user_email', async (req, res) => {
  try {
    const { user_email } = req.params;
    const { limit = 50, unread_only = false } = req.query;

    let query = 'SELECT * FROM notifications WHERE user_email = ?';
    const params = [user_email];

    if (unread_only === 'true') {
      query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [notifications] = await pool.query(query, params);

    // Get unread count
    const [unreadCount] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_email = ? AND is_read = 0',
      [user_email]
    );

    res.json(formatResponse(true, {
      notifications,
      unread_count: unreadCount[0].count,
      total: notifications.length
    }, 'Notifications retrieved successfully'));
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Create Notification
app.post('/notifications', async (req, res) => {
  try {
    const { user_email, title, message, type = 'message', event_id = null } = req.body;

    if (!user_email || !title || !message) {
      return res.status(400).json(formatResponse(false, null, null, 'User email, title, and message are required'));
    }

    const [result] = await pool.query(
      `INSERT INTO notifications (user_email, title, message, type, event_id, is_read, created_at, status)
       VALUES (?, ?, ?, ?, ?, 0, NOW(), 'pending')`,
      [user_email, title, message, type, event_id]
    );

    res.json(formatResponse(true, {
      notification_id: result.insertId,
      user_email,
      title
    }, 'Notification created successfully'));
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Mark Notification as Read
app.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );

    res.json(formatResponse(true, null, 'Notification marked as read'));
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Mark All Notifications as Read
app.patch('/notifications/read_all/:user_email', async (req, res) => {
  try {
    const { user_email } = req.params;

    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_email = ? AND is_read = 0',
      [user_email]
    );

    res.json(formatResponse(true, {
      updated_count: result.affectedRows
    }, 'All notifications marked as read'));
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// Delete Notification
app.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM notifications WHERE id = ?', [id]);

    res.json(formatResponse(true, null, 'Notification deleted successfully'));
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json(formatResponse(false, null, null, error.message));
  }
});

// ==================== ERROR HANDLING MIDDLEWARE ====================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json(formatResponse(false, null, null, err.message || 'Internal server error'));
});

// ==================== ROOT ENDPOINT ====================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DojoConnect Backoffice API',
    version: '1.0.0',
    endpoints: {
      exporting: [
        'POST /export/users',
        'POST /export/classes',
        'POST /export/transactions',
        'POST /export/attendance',
        'POST /export/enrollments'
      ],
      profiles: [
        'GET /class_profile/:class_uid',
        'GET /user_profile_detailed/:email'
      ],
      admin: [
        'POST /admin/users/create',
        'PUT /admin/users/:email',
        'PATCH /admin/users/:email/status',
        'DELETE /admin/users/:email',
        'DELETE /admin/users/:email/hard',
        'POST /admin/classes/create',
        'PUT /admin/classes/:class_uid',
        'DELETE /admin/classes/:class_uid',
        'POST /admin/classes/:class_uid/enroll',
        'DELETE /admin/classes/:class_uid/unenroll/:student_email',
        'POST /admin/classes/:class_uid/attendance/export'
      ],
      metrics: [
        'POST /metrics/revenue',
        'POST /metrics/enrollment',
        'POST /metrics/attendance',
        'POST /metrics/subscriptions',
        'POST /metrics/overview'
      ],
      notifications: [
        'GET /notifications/:user_email',
        'POST /notifications',
        'PATCH /notifications/:id/read',
        'PATCH /notifications/read_all/:user_email',
        'DELETE /notifications/:id'
      ]
    }
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`\n🚀 DojoConnect Backoffice API running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`📚 Database: ${dbConfig.database}`);
  console.log(`\n✓ All endpoints ready!\n`);
});

module.exports = app;

