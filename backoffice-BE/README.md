# Back Office API - Setup & Installation Guide

## Prerequisites

- Node.js (v14+)
- npm
- MySQL
- cPanel access (for deployment)

## Local Setup

### 1. Install Dependencies

```bash
cd back-office/backoffice-BE
npm install
```

### 2. Database Setup

The application requires two MySQL databases:

**Database 1:**
- Name: `dojoburz_trial`
- User: `dojoburz_trial`
- Password: `]!pT(TqFTj^h`

**Database 2:**
- Name: `dojoburz_dojoconnect`
- User: `dojoburz_dojoconnect`
- Password: `Trodpen2022*??-23`

**To extract database tables:**
1. Login to cPanel
2. Navigate to phpMyAdmin
3. Select database → Export tab → Quick export → SQL format → Go
4. Repeat for second database
5. Import SQL files into your local MySQL databases

### 3. Environment Variables

Create `.env` file:

```env
PORT=5000
ZOHO_EMAIL=hello@dojoconnect.app
ZOHO_PASSWORD=Connectdojo1!
```

### 4. Run Application

```bash
npm start
```

Verify: `curl http://localhost:5000/` should return `Dojo API is running 🚀`

## cPanel Deployment

### 1. Upload Files

Upload project files to cPanel (via File Manager, FTP, or SSH). Exclude `node_modules` folder.

### 2. Create Databases

1. cPanel → MySQL Databases
2. Create two databases (cPanel will prefix with username)
3. Create users and grant ALL PRIVILEGES
4. Note down actual database names and credentials

### 3. Update Database Config

Edit `app.js` and update database credentials (lines 18-24 and 173-181) with your cPanel database names and passwords.

### 4. Install Dependencies

Via SSH or cPanel Terminal:
```bash
cd ~/public_html/backoffice-api
npm install --production
```

### 5. Setup Node.js App

1. cPanel → Setup Node.js App
2. Create Application:
   - Node.js version: v14+
   - Application root: your folder name
   - Application startup file: `app.js`
3. Add environment variables: `PORT`, `ZOHO_EMAIL`, `ZOHO_PASSWORD`
4. Click Run NPM Install
5. Click Restart App

### 6. Verify

Check logs in Setup Node.js App → View Logs. Test API endpoint in browser.

## Troubleshooting

- **Database connection fails**: Verify credentials and MySQL service is running
- **Port in use**: Change PORT in `.env` or kill process on port 5000
- **App won't start**: Check logs, verify `app.js` is startup file, ensure dependencies installed
- **Module not found**: Run `npm install` again on server
