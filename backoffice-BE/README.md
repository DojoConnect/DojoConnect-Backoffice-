# DojoConnect Backoffice API

## Project Overview
This is the backend API for the DojoConnect Backoffice application. 

## Tech Stack
-   **Runtime**: Node.js (v20+)
-   **Framework**: Express
-   **Language**: TypeScript
-   **Database**: MariaDB (via Drizzle ORM)
-   **Testing**: Vitest
-   **Validation**: Zod
-   **Authentication**: JWT

## Prerequisites
-   Node.js (v20+)
-   npm
-   MariaDB
-   Docker (optional, for local database)

## Environment Variables
The application requires several environment variables to function correctly (Database, Stripe, Cloudinary, etc.).

> [!NOTE]
> The complete list of required environment variables and their types can be found in [src/config/AppConfig.ts](src/config/AppConfig.ts).

Create a `.env` file in the root directory and populate it with the variables defined in `AppConfig.ts`.

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup

#### Using Docker (Recommended for local dev)
You can spin up a local MariaDB instance using Docker. This will also set up phpMyAdmin on http://localhost:8080.
```bash
docker compose up -d
```
*Note: Ensure your `.env` variables match the credentials in `docker-compose.yml`.*

#### Manual Database Configuration (Alternative)
If you prefer not to use Docker, you can install MariaDB locally and run the following SQL to set up the use:
```sql
CREATE USER IF NOT EXISTS 'devuser'@'localhost' IDENTIFIED BY 'devpassword';
ALTER USER 'devuser'@'localhost' IDENTIFIED BY 'devpassword';
GRANT ALL PRIVILEGES ON `dojoburz_dojoconnect`.* TO 'devuser'@'localhost';
FLUSH PRIVILEGES;
```

#### Database Migrations (Drizzle)
This project uses Drizzle ORM for database management.

-   **Generate Migrations**: Generates SQL migration files based on schema changes.
    ```bash
    npm run db:generate
    ```
-   **Run Migrations**: Applies the migrations to the database.
    ```bash
    npm run db:migrate
    ```

#### Database Relations & Query Patterns

This project takes a manual approach to handling database relations for better control and compatibility.

**Why Manual Relations?**
- Drizzle ORM does not have full support for MariaDB's relational features.
- We define foreign keys at the database/schema level but do not declare ORM-level relations (1:1, 1:M, M:M).
- This gives us explicit control over how and when related data is fetched.

**Best Practices:**
- **Limit joins**: Avoid using more than one join in a single query to keep queries simple and performant.
- **1:1 or single-row fetches**: Use joins when fetching a single related row (e.g., user profile).
- **1:M or multi-row fetches**: Use separate queries to fetch related data. First, fetch and filter the main dataset, then fetch related records in a second query. This ensures you only retrieve the data you need and avoids N+1 problems. 

### 3. Run Application
```bash
npm run dev
```
The server will start on the port specified in your `.env` (default 5002).

## Scripts
The following scripts are available in `package.json`:

-   `npm run dev`: Starts the development server with watch mode (`tsx`).
-   `npm run build`: Builds the project for production (cleans `dist`, compiles TS).
-   `npm run start`: Starts the production server from `dist/server.js`.
-   `npm test`: Runs unit tests using Vitest.
-   `npm run db:generate`: Generates Drizzle migration files.
-   `npm run db:migrate`: Applies Drizzle migrations to the database.

## Testing
For detailed testing instructions, please refer to [TESTING-GUIDE.md](TESTING-GUIDE.md).

To run the tests:
```bash
npm test
```

## Deployment

### Automated Deployment (Recommended)
This repository uses GitHub Actions for automated deployment to cPanel. Pushing to the `production` branch triggers the deployment workflow defined in `.github/workflows`.

### Manual Deployment (Legacy)
If you need to deploy manually:
1.  **Build**: `npm run build`
2.  **Upload**: Upload the contents of `dist`, `package.json`, and `.env` to the server.
3.  **Install**: Run `npm install --production` on the server.
4.  **Restart**: Restart the Node.js application via cPanel.

## Troubleshooting
-   **Database connection fails**: Verify credentials and MySQL service is running.
-   **Port in use**: Change `PORT` in `.env` or kill the process using the port.
-   **Module not found**: Run `npm install` again.
-   **App won't start**: Check logs, verify `dist/server.js` is startup file, ensure dependencies installed
