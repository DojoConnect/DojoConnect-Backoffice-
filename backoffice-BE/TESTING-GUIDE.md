# Email Endpoints Testing Guide

## Quick Setup

1. Replace `your_dojo_tag_here` with an actual dojo_tag from your database
2. Replace test email addresses with your own email to receive test emails
3. Make sure your server is running on `http://localhost:5000`

## ⏰ Time Format Support

The API now supports **both** time formats:

- **12-hour format**: `"10:00 AM"`, `"2:30 PM"` ✅ (Recommended - easier to read)
- **24-hour format**: `"10:00:00"`, `"14:30:00"` ✅ (Also works)

The system automatically converts 12-hour format to 24-hour for database storage, and converts back to 12-hour format for email display!

---

## 1️⃣ Test Email (Basic Email Configuration)

**Endpoint:** `POST /test-email`

```json
{
  "email": "your-email@example.com"
}
```

**Expected Result:** You should receive a test email from Dojo Connect

---

## 2️⃣ Appointment Request Confirmation - Physical

**Endpoint:** `POST /appointment-requests`

```json
{
  "dojo_tag": "your_dojo_tag_here",
  "dojo_email": "dojo@example.com",
  "parent_name": "Sarah Johnson",
  "email_address": "your-email@example.com",
  "contact_details": "+1-555-0123",
  "reason_for_consultation": "Interested in enrolling my child in karate classes",
  "preferred_contact_method": "email",
  "preferred_time_range": "Morning",
  "number_of_children": 2,
  "additional_notes": "My children are 7 and 9 years old",
  "consent_acknowledged": true,
  "appointment_type": "Physical",
  "status": "pending"
}
```

**Expected Email:**

- Subject: "Your Appointment Request Has Been Received"
- Contains: Appointment type, reason, time range, number of children

**Save the response `id` field - you'll need it for scheduling!**

---

## 3️⃣ Appointment Request Confirmation - Online

**Endpoint:** `POST /appointment-requests`

```json
{
  "dojo_tag": "your_dojo_tag_here",
  "dojo_email": "dojo@example.com",
  "parent_name": "Michael Chen",
  "email_address": "your-email@example.com",
  "contact_details": "+1-555-0456",
  "reason_for_consultation": "Want to learn about your programs",
  "preferred_contact_method": "phone",
  "preferred_time_range": "Afternoon",
  "number_of_children": 1,
  "additional_notes": "Prefer video call consultation",
  "consent_acknowledged": true,
  "appointment_type": "Online",
  "status": "pending"
}
```

**Expected Email:**

- Subject: "Your Appointment Request Has Been Received"
- Shows Online appointment type

**Save the response `id` field!**

---

## 4️⃣ Schedule Physical Appointment

**Endpoint:** `POST /admin/scheduled-appointments`

```json
{
  "consultation_request_id": 1,
  "dojo_tag": "your_dojo_tag_here",
  "scheduled_date": "2025-10-15",
  "start_time": "10:00 AM",
  "end_time": "11:00 AM",
  "address_text": "123 Martial Arts Way, Downtown, CA 90210",
  "meeting_link": null,
  "parent_email": "your-email@example.com",
  "parent_name": "Sarah Johnson"
}
```

**Expected Email:**

- Subject: "Your Appointment Has Been Scheduled"
- Contains: Date, Time, Physical location address

**Save the response `id` field for cancel/reschedule!**

---

## 5️⃣ Schedule Online Appointment

**Endpoint:** `POST /admin/scheduled-appointments`

```json
{
  "consultation_request_id": 2,
  "dojo_tag": "your_dojo_tag_here",
  "scheduled_date": "2025-10-16",
  "start_time": "2:00 PM",
  "end_time": "3:00 PM",
  "address_text": null,
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "parent_email": "your-email@example.com",
  "parent_name": "Michael Chen"
}
```

**Expected Email:**

- Subject: "Your Online Appointment Has Been Scheduled"
- Contains: Date, Time, Meeting Link (clickable)

**Save the response `id` field!**

---

## 6️⃣ Cancel Appointment

**Endpoint:** `POST /admin/cancel-appointment`

```json
{
  "appointment_id": 1,
  "dojo_tag": "your_dojo_tag_here"
}
```

**Expected Email:**

- Subject: "Appointment Canceled"
- Contains: Original date/time, link to reschedule

---

## 7️⃣ Reschedule Physical Appointment

**Endpoint:** `POST /admin/reschedule-appointment`

```json
{
  "appointment_id": 1,
  "dojo_tag": "your_dojo_tag_here",
  "new_scheduled_date": "2025-10-20",
  "new_start_time": "11:00 AM",
  "new_end_time": "12:00 PM",
  "new_address_text": "456 New Dojo Street, Downtown, CA 90211",
  "new_meeting_link": null
}
```

**Expected Email:**

- Subject: "Appointment Update – Rescheduled"
- Contains: New date, new time, new location

---

## 8️⃣ Reschedule Online Appointment

**Endpoint:** `POST /admin/reschedule-appointment`

```json
{
  "appointment_id": 2,
  "dojo_tag": "your_dojo_tag_here",
  "new_scheduled_date": "2025-10-18",
  "new_start_time": "3:00 PM",
  "new_end_time": "4:00 PM",
  "new_address_text": null,
  "new_meeting_link": "https://zoom.us/j/123456789"
}
```

**Expected Email:**

- Subject: "Appointment Update – Rescheduled"
- Contains: New date, new time, new meeting link

---

## 9️⃣ Trial Class Booking Confirmation

**Endpoint:** `POST /trial-class-bookings`

```json
{
  "class_id": 1,
  "parent_name": "Jennifer Martinez",
  "email": "your-email@example.com",
  "phone": "+1-555-0789",
  "appointment_date": "2025-10-25",
  "dojo_tag": "your_dojo_tag_here",
  "status": "pending",
  "number_of_children": 2,
  "class_name": "Beginner Karate",
  "instructor_name": "Sensei John Smith",
  "class_image": "https://example.com/karate-class.jpg",
  "trial_fee": 25
}
```

**Expected Email:**

- Subject: "Your Trial Class Booking Has Been Confirmed"
- Contains: Class name, instructor, date, number of children, trial fee
- Includes: What to bring checklist

**Save the response `id` field!**

---

## Testing Workflow (Recommended Order)

### Test 1: Complete Physical Appointment Flow

1. **Test basic email** → Test endpoint #1
2. **Create physical request** → Use endpoint #2 (note the `id`)
3. **Schedule it** → Use endpoint #4 (use `id` from step 2 as `consultation_request_id`)
4. **Reschedule it** → Use endpoint #7 (use `id` from step 3 as `appointment_id`)
5. **Cancel it** → Use endpoint #6 (use same `appointment_id`)

### Test 2: Complete Online Appointment Flow

1. **Create online request** → Use endpoint #3 (note the `id`)
2. **Schedule it** → Use endpoint #5 (use `id` from step 1 as `consultation_request_id`)
3. **Reschedule it** → Use endpoint #8 (use `id` from step 2 as `appointment_id`)
4. **Cancel it** → Use endpoint #6 (use same `appointment_id`)

### Test 3: Trial Class Booking

1. **Create trial class booking** → Use endpoint #9
2. **Check email** → Should receive booking confirmation with class details

---

## Important Notes

⚠️ **Before Testing:**

- Replace `your_dojo_tag_here` with an actual dojo_tag from your database
- Replace `your-email@example.com` with your real email address
- Make sure you have a dojo in your database with the tag you're using

⏰ **Time Format Tips:**

- Use 12-hour format: `"10:00 AM"`, `"2:30 PM"`, `"11:45 PM"` (easier to read)
- Or 24-hour format: `"10:00:00"`, `"14:30:00"`, `"23:45:00"` (also works)
- The system handles conversion automatically!
- Emails will always show times in friendly 12-hour format

🔍 **After Each Request:**

- Check your email inbox for the email
- Check the server console logs for confirmation messages like `📧 Appointment email sent to...`
- Note down the `id` values from responses for subsequent tests

❌ **If Emails Don't Arrive:**

1. Check spam/junk folder
2. Verify Zoho credentials in `app.js` are correct
3. Check server console for error messages
4. Ensure `transporter` configuration is correct

❌ **If You Get Time Format Errors:**

- This has been fixed! The API now accepts both `"10:00 AM"` and `"10:00:00"` formats
- If you still see errors, make sure you're using the updated code
- Times are automatically converted for MySQL compatibility

---

## Quick Copy-Paste Variables

Use these as your test values (easy to find and replace):

```
YOUR_DOJO_TAG = "your_dojo_tag_here"
YOUR_EMAIL = "your-email@example.com"
DOJO_EMAIL = "dojo@example.com"
```

Find and replace these in all the JSON bodies above before testing!
