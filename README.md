# Expense Tracker Pro

Android-first expense, pending balance, and payment tracker with web, PWA, and Capacitor Android support.

## What is included

- Private authenticated workspaces
- Expense entry in a few taps
- Payment received tracking
- Person management
- Recent entries, search, filters, bulk delete, move to payment received
- Notification center
- Daily / weekly / monthly / yearly reports
- XLSX, ODS, CSV, and JSON export/import
- PWA manifest and service worker
- Capacitor configuration for Android packaging

## Stack

- Next.js App Router
- Prisma
- PostgreSQL
- Custom cookie-based auth
- Tailwind CSS
- SheetJS for XLSX/ODS
- Papa Parse for CSV
- Capacitor for Android wrapping

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your PostgreSQL database.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Push the schema:
   ```bash
   npm run db:push
   ```
   Or use migrations:
   ```bash
   npm run db:migrate
   ```
5. Generate the client:
   ```bash
   npm run build
   ```
   or
   ```bash
   npx prisma generate
   ```
6. Start the app:
   ```bash
   npm run dev
   ```

## First use

Create a new account at `/signup`.  
The app creates a private workspace for that user and seeds:

- Me
- Vedant
- Sachin

## Android APK build

Install Capacitor and the Android platform:

```bash
npm install
npx cap init "Expense Tracker Pro" "com.expensetracker.pro"
npx cap add android
```

Set `CAPACITOR_SERVER_URL` to the deployed web app URL, then run:

```bash
npx cap sync android
npx cap open android
```

Build an APK or AAB from Android Studio. The Android wrapper loads the hosted app URL inside the native container.

## PWA setup

The app includes:

- `app/manifest.js`
- `public/sw.js`
- `components/pwa-register.js`

That is enough for installable home-screen behavior in supported browsers.

## Deploy

### Web
Deploy the Next.js app to any Node-compatible host and point it at PostgreSQL.

### Database
Use PostgreSQL in production. The schema is in `prisma/schema.prisma`.

### Android
Build the web app first, then package with Capacitor.

## Notes

- All reads and writes are protected by the authenticated workspace.
- Records are filtered server-side by workspace, so shared links do not expose other users’ data.
- The app is designed mobile-first and opens directly to the dashboard after login.
