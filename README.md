# Chronos ERP-Grade HRMS — Hackathon Submission

Chronos is a production-grade, high-performance Human Resource Management System (HRMS) designed with a clean NestJS backend architecture, a reactive React + Vite + TypeScript frontend, and PostgreSQL as the primary database. Built specifically for Odoo's hiring hackathon, the system prioritizes architecture quality, strict TypeScript typing, transaction reliability, and performance optimization.

---

## 1. System Architecture

Chronos is decoupled into a clear client-server architecture:

```mermaid
graph TD
    Client[React + Vite + TS Frontend] -->|HTTP REST + JWT| Gateway[NestJS Gateway API /api/v1]
    Gateway -->|Guards & Decorators| Auth[Auth Module / Passport JWT]
    Gateway -->|Service Layer| Services[Business Logic Modules]
    Services -->|Prisma Client| DB[(PostgreSQL 15)]
    Services -->|Audit Hook| Audit[Append-Only Audit Logging]
    Services -->|Notify Hook| Notify[In-App Alerts + Stub SMTP]
```

### Backend (NestJS + Prisma + PostgreSQL)
- **Modular Design**: Cohesive features grouped in separate modules (Auth, Employees, Departments, Attendance, Leaves, Payroll, Dashboard, Notifications, AI).
- **Domain Separation**: Clean separation between Controllers (routing & HTTP validation), Services (business rules & transactions), and Repositories (database mapping).
- **Strict Data Validation**: Automatic class-validator pipes mapping DTO payloads.
- **Custom Exceptions Filter**: Catching and converting all errors into a unified standard response shape `{ error: { code, message, details } }`.

### Frontend (React + Vite + TypeScript + TailwindCSS v4)
- **TailwindCSS v4**: Configured with the latest CSS-first configuration and compiler.
- **SPA Routing**: Client-side routing with React Router v6, protected paths, and role-based guards.
- **Authentication Interceptor**: Decodes JWT base64 payloads locally, rotates tokens silently using HTTP-only interceptors, and redirects cleanly on session expiration.

---

## 2. Database Schema & ERD

We model our data using Prisma, leveraging compound indices, foreign key references, and constraints to ensure absolute data integrity.

### ASCII Entity Relationship Diagram

```text
  [User] 1 -------- 0..1 [Employee] 1 -------- 0..* [Attendance]
    |                      |
    | 1                    | 1
  [Role]                   +----------------- 0..* [LeaveBalance]
    |                      |
  [Permission]             +----------------- 0..* [LeaveRequest]
                           |
                           +----------------- 0..* [Payslip]
                           |
  [Department] 1 ----------+ (Head Employee)
```

### Table Schema Summary
- **User / Role / Permission**: Implements strict Role-Based Access Control (RBAC). Permitted actions (e.g. `employee:create`) are packed in JWTs instead of raw role names for maximum granularity.
- **Employee**: Stores designation, join date, status, manager self-references (`managerId` -> `Employee.id`), and soft-deletes (`deletedAt`).
- **Department**: Maps department code, name, and the head manager.
- **Attendance**: Records daily check-in, check-out, worked minutes, and status (`PRESENT`, `LATE`, `HALF_DAY`, `ABSENT`).
- **LeaveBalance / LeaveRequest**: Tracks allocated/used leave quotas per employee/type/year.
- **PayrollRun / Payslip**: Tracks monthly runs (`DRAFT`, `PROCESSED`, `PAID`) and saves prorated earnings/deductions breakdown line items inside a JSONB field.
- **AuditLog**: Write-once audit trails logging critical mutations.
- **Notification**: Stores personal unread in-app alerts.

---

## 3. Core Technical Implementations

### A. Rotated, Revocable Refresh Tokens
To guarantee security, refresh tokens are rotated on every use and hashed inside the database. If a compromised refresh token is reused, the token chain is immediately revoked (all active sessions are terminated) to prevent session hijacking.

### B. Circular Manager Chain Validation
When creating or editing employee profiles, the service executes a depth-first search (DFS) graph-traversal check to verify reporting relationships. If a manager assignment would form a loop (e.g. Employee A reports to B, B reports to C, and C reports to A), the transaction is blocked, returning a validation failure.

### C. Attendance & Leave Deductions
- **Tardiness Flag**: Shifts starting after 09:00 AM allow a 15-minute grace period. Check-in after 09:15 AM applies a `LATE` status.
- **Worked Hours Threshold**: Check-out with less than 4 hours worked adjusts the record status to `HALF_DAY`.
- **Leave Quotas**: Overlapping applications or requesting days exceeding the available balance are rejected. Approving a request increments `used` and decrements `available` balances atomically within a database transaction.

### D. Worked-Day Payroll Proration
Calculates payslips with precise proration:
- **Mid-Month Joiners**: Limits base earnings based on active calendar days between join date and end of the month.
- **Unpaid Absences**: Subtracts unapproved absences (`ABSENT` count as 1 day, `HALF_DAY` count as 0.5 days) and approved `Unpaid Leave` days from the payout.

---

## 4. Local Installation & Setup

### Prerequisites
- Node.js v18 or newer
- PostgreSQL 15+ installed locally and running on port 5432

### Setup Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/http-pruthvi/Chronos.git
   cd Chronos
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hrms_db?schema=public"
   JWT_SECRET="hackathon_super_secret_key_123!"
   JWT_REFRESH_SECRET="hackathon_refresh_super_secret_key_123!"
   PORT=3000
   ```

3. **Install Dependencies**:
   ```bash
   # Install Backend dependencies
   cd backend
   npm install

   # Install Frontend dependencies
   cd ../frontend
   npm install
   ```

4. **Initialize Database & Seed**:
   In the `backend/` directory, run:
   ```bash
   npx prisma migrate dev --name init
   ```
   *This automatically sets up all PostgreSQL tables and triggers the `seed.ts` script to populate the demo dataset.*

5. **Start Dev Servers**:
   Run both dev servers concurrently (or in separate terminals):
   ```bash
   # Start NestJS API
   cd backend
   npm run start:dev

   # Start React App
   cd ../frontend
   npm run dev
   ```

6. **Open the browser**:
   Navigate to `http://localhost:5173`. You can log in using the demo accounts (Admin: `admin@demo.com`, Password: `DemoPassword123!`).

---

## 5. Running Tests

### Unit Tests
To run backend service unit tests:
```bash
cd backend
npm run test
```

### Integration Tests
To run backend HTTP integration tests against the live database:
```bash
cd backend
npm run test:integration
```

---

## 6. Docker Compose Deployment

To build and run the entire stack (PostgreSQL, NestJS API, React Frontend via Nginx) inside Docker:

```bash
docker-compose up --build
```
The services will be exposed at:
- **Frontend App**: `http://localhost`
- **Backend API Docs (Swagger)**: `http://localhost:3000/api/docs`

---
