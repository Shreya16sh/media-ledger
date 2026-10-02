# MediaLedger — Media Invoice Tracker

A small full-stack app inspired by media-agency operations work (like at Publicis Re:Sources):
you log in, see a dashboard of totals, and manage **bookings** (media placements booked for a
client campaign) and **invoices** (bills raised against those bookings).

**Stack:** Angular (frontend) → Node.js + Express (backend API) → SQL Server (database).

```
Browser (Angular app, port 4200)
        │  HTTP requests (fetch data, save forms)
        ▼
Express API (Node.js, port 5000)
        │  SQL queries
        ▼
SQL Server database (MediaLedgerDB)
```

---

## 1. Folder structure

```
media-ledger/
├── database/
│   └── schema.sql              ← run this once in SSMS to create the DB
├── backend/
│   ├── config/db.js            ← connects to SQL Server
│   ├── middleware/auth.js      ← checks the login token on protected routes
│   ├── routes/
│   │   ├── auth.js             ← POST /api/auth/login
│   │   ├── bookings.js         ← GET/POST/PUT/DELETE /api/bookings
│   │   ├── invoices.js         ← GET/POST/PUT/DELETE /api/invoices
│   │   └── dashboard.js        ← GET /api/dashboard/summary
│   ├── server.js               ← starts the Express server
│   ├── package.json
│   └── .env.example            ← copy to .env and fill in your DB password
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── login/              ← login page
    │   │   ├── dashboard/          ← stat cards + recent bookings
    │   │   ├── bookings/           ← bookings table + add/edit/delete/search
    │   │   ├── invoices/           ← invoices table + add/edit/delete/search
    │   │   ├── services/           ← code that talks to the backend API
    │   │   ├── guards/auth.guard.ts← blocks pages if you're not logged in
    │   │   ├── app.module.ts       ← registers everything above
    │   │   └── app-routing.module.ts ← maps URLs to pages
    │   ├── index.html
    │   ├── main.ts
    │   └── styles.css              ← the pink design system (colors, buttons, cards)
    ├── angular.json
    ├── package.json
    └── tsconfig*.json
```

---

## 2. How the pieces talk to each other (in plain language)

1. You open the Angular app in your browser. It shows the **login page**.
2. You type a username/password and click **Sign in**. Angular sends that to
   `POST http://localhost:5000/api/auth/login`.
3. Express checks the `Users` table in SQL Server. If it matches, it sends back a
   **token** (a random string proving you're logged in) and your name.
4. Angular saves that token in the browser's `localStorage` and takes you to the dashboard.
5. From now on, every request Angular makes (get bookings, save an invoice, etc.) carries
   that token in its `Authorization` header. Express checks for the token before running
   any bookings/invoices query — this is what "protects" those routes.
6. Express turns every request into a SQL query (using the `mssql` npm package) and sends
   the result back as JSON. Angular displays that JSON in tables and forms.

---

## 3. Setup — step by step

### Step A: Set up the database (SQL Server)
1. Install **SQL Server** (Developer/Express edition) and **SSMS** if you don't have them.
2. Open SSMS, connect to your local server.
3. Open `database/schema.sql` and click **Execute**. This creates the `MediaLedgerDB`
   database, three tables (`Users`, `Bookings`, `Invoices`), and some sample data.
4. Note down: your SQL Server **login username/password** (or confirm you're using Windows
   Authentication with a `sa` account enabled) — you'll need this in Step B.

### Step B: Set up the backend
```bash
cd backend
npm install
copy .env.example .env      # on Mac/Linux: cp .env.example .env
```
Open `.env` and fill in your real SQL Server username/password:
```
DB_USER=sa
DB_PASSWORD=YourStrong@Password
DB_SERVER=localhost
DB_DATABASE=MediaLedgerDB
DB_PORT=1433
PORT=5000
```
Then start the server:
```bash
npm start
```
You should see:
```
✅ Connected to SQL Server (MediaLedgerDB)
🚀 MediaLedger backend running on http://localhost:5000
```
Visit `http://localhost:5000` in a browser — you should see "MediaLedger API is running."

### Step C: Set up the frontend
Open a **new** terminal (keep the backend running in the first one):
```bash
cd frontend
npm install
npm start
```
This opens the Angular dev server at `http://localhost:4200`. Open that URL in your browser.

### Step D: Log in
Use the demo account created by `schema.sql`:
- **Username:** `admin`
- **Password:** `admin123`

You should land on the dashboard, then be able to browse to Bookings and Invoices.

---

## 4. Common errors and how to fix them

**"❌ Database connection failed" in the backend terminal**
- Make sure SQL Server is actually running (check SQL Server Configuration Manager, or
  Services on Windows — look for "SQL Server (MSSQLSERVER)").
- Double check `DB_USER` / `DB_PASSWORD` / `DB_SERVER` in `.env` match what works in SSMS.
- If you use SQL Server Express, your server name might be `localhost\SQLEXPRESS` —
  set `DB_SERVER=localhost\\SQLEXPRESS` in that case.
- Make sure **SQL Server Authentication** (not only Windows Authentication) is enabled, and
  that TCP/IP is enabled in SQL Server Configuration Manager (it's off by default sometimes).

**Angular shows a blank page / errors about "Cannot GET /"**
- Make sure you ran `npm start` inside `frontend/`, not `backend/`.
- Hard refresh the browser (Ctrl+Shift+R) after the first successful compile.

**Login says "Invalid username or password" even though you typed `admin`/`admin123`**
- Confirm `schema.sql` actually ran successfully — open SSMS, expand
  `MediaLedgerDB > Tables > dbo.Users`, right-click "Select Top 1000 Rows" and confirm the
  `admin` row exists.

**"CORS" errors in the browser console (something like "blocked by CORS policy")**
- Make sure the backend is running (`npm start` in `backend/`) *before* you use the frontend.
- The backend already has `app.use(cors())` in `server.js`, which allows the Angular app
  (a different port) to call it. If you changed the backend port, update the `API_URL`
  constants at the top of each file in `frontend/src/app/services/`.

**"Cannot find module 'mssql'" or similar when starting the backend**
- Run `npm install` again inside `backend/` — a dependency didn't finish installing.

**Table already has data from a previous run and you want a clean slate**
- Just re-run `database/schema.sql` — it drops and recreates the tables each time.

If you hit an error that isn't listed here, copy the exact error message and share it —
that's usually enough to figure out exactly which line is causing it.

---

## 5. Things worth knowing (since this is a learning project)

- **Passwords are stored in plain text** in the `Users` table, and the login "token" is just
  a string, not a real JWT. This keeps the code easy to read for a first full-stack project.
  In a production app you would hash passwords (e.g. with `bcrypt`) and use signed JWTs.
- **CRUD** = Create, Read, Update, Delete — the four basic operations you'll see repeated for
  both Bookings and Invoices, both in the backend routes and the Angular services.
- The Angular app uses the classic **NgModule** style (not standalone components), which is
  what most real enterprise Angular codebases still use, and reads a little more explicitly
  for a first project.
- Feel free to add more fields (e.g. a client contact email, an invoice due date) by adding a
  column in `schema.sql`, then updating the matching route in `backend/routes/`, and finally
  the form fields in the matching Angular component.

## 6. SnapShot of website
<img width="956" height="535" alt="Screenshot 2026-10-02 235924" src="https://github.com/user-attachments/assets/90a8806b-c86a-4776-87c1-a243be88a710" />

<img width="958" height="473" alt="Screenshot 2026-10-02 235947" src="https://github.com/user-attachments/assets/6d798bab-314d-48df-8bee-25f6af41a659" />

<img width="955" height="473" alt="Screenshot 2026-10-03 000006" src="https://github.com/user-attachments/assets/4f2f8db6-e1dd-4396-a07f-9d8abf22906e" />

<img width="958" height="471" alt="Screenshot 2026-10-03 000057" src="https://github.com/user-attachments/assets/01b30971-9c69-48e8-a9cd-5b05d8e5aac1" />

<img width="959" height="469" alt="Screenshot 2026-10-03 000109" src="https://github.com/user-attachments/assets/10a2fa91-b8f0-4ac6-ace3-bd71847c68d9" />
