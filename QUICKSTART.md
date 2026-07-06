# 🚀 ShiftSwap - Quick Start Guide

## ✅ Application is Ready!

Your ShiftSwap MVP is **fully built and running** at: **http://localhost:3000**

## 🎉 What's Been Built

A complete shift management web application with:
- ✅ Employee shift posting and claiming
- ✅ Manager approval workflow
- ✅ Overtime risk detection (40+ hours/week)
- ✅ Complete audit trail (90-day retention)
- ✅ CSV export for compliance
- ✅ Demo mode with realistic sample data
- ✅ Multi-database support (SQLite, PostgreSQL, MySQL)
- ✅ Modern responsive UI with Tailwind CSS
- ✅ REST API with authentication
- ✅ Role-based access control

## 🎭 Demo Mode (Currently Active)

The server is running in **DEMO MODE** with:
- **17 sample users** (employees and managers)
- **30 shifts** in various states (open, claimed, approved, rejected)
- **18 claims** with different statuses
- **12 approval decisions**
- **62 audit log entries**

### Demo Credentials

You can login with any of these employee IDs (no password required in demo):

**Employees:**
- `EMP001`, `EMP002`, `EMP003`, ... `EMP010`

**Managers:**
- `MGR001`, `MGR002`, `MGR003`, ... `MGR007`

## 📱 How to Use the App

### 1. Open the Application
Navigate to: **http://localhost:3000**

### 2. Login
- Enter an employee ID (e.g., `EMP001` or `MGR001`)
- Click "Login"

### 3. As an Employee
**View Dashboard:**
- See available open shifts you can claim
- View your posted shifts and their status
- Track your claimed shifts

**Post a Shift:**
- Click "Post New Shift"
- Fill in date, time, role, location
- Submit to make it available for claiming

**Claim a Shift:**
- Browse open shifts on the dashboard
- Click "Claim" on any available shift
- Wait for manager approval

**Cancel a Claim:**
- Go to "My Claims"
- Cancel any claim that's still "Pending Approval"
- (Cannot cancel after manager approval)

### 4. As a Manager
**Approval Queue:**
- See all pending shift claims
- View overtime risk warnings (if claim pushes employee >40 hrs/week)
- Approve or reject each claim

**Team Overview:**
- Monitor all shifts across the team
- See escalation alerts (shifts <4 hours from start with no claims)
- Track swap history

**Reports:**
- View complete audit trail
- Filter by date range
- Export to CSV for payroll/compliance

## 🔧 Configuration

### Current Settings (.env)
```
NODE_ENV=development
PORT=3000
DB_MODE=sqlite
DEMO_MODE=true
```

### Change to Production Mode

1. **Set up PostgreSQL or MySQL:**
   ```bash
   # For PostgreSQL
   DB_MODE=postgres
   POSTGRES_HOST=your-host
   POSTGRES_PORT=5432
   POSTGRES_DB=shiftswap
   POSTGRES_USER=your-user
   POSTGRES_PASSWORD=your-password
   
   # For MySQL
   DB_MODE=mysql
   MYSQL_HOST=your-host
   MYSQL_PORT=3306
   MYSQL_DB=shiftswap
   MYSQL_USER=your-user
   MYSQL_PASSWORD=your-password
   ```

2. **Disable demo mode:**
   ```bash
   DEMO_MODE=false
   ```

3. **Restart the server:**
   ```bash
   npm start
   ```

## 📊 API Endpoints

The application exposes a REST API at `/api/*`:

### Authentication
- `POST /api/auth/login` - Login with employee ID
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Shifts
- `GET /api/shifts` - List all shifts (with filters)
- `GET /api/shifts/:id` - Get shift details
- `POST /api/shifts` - Post new shift
- `DELETE /api/shifts/:id` - Cancel shift

### Claims
- `POST /api/claims` - Claim a shift
- `DELETE /api/claims/:id` - Cancel claim
- `GET /api/claims/:id` - Get claim details

### Approvals (Managers only)
- `GET /api/approvals/pending` - Get pending approvals
- `POST /api/approvals/:claimId/approve` - Approve claim
- `POST /api/approvals/:claimId/reject` - Reject claim

### Reports
- `GET /api/reports/audit` - Get audit trail
- `GET /api/reports/export` - Export to CSV

## 🧪 Testing

Run the test suite:
```bash
npm test
```

All tests are currently passing ✅

## 🛠️ Development

### Start with auto-reload:
```bash
npm run dev
```

### Run migrations manually:
```bash
npm run migrate
```

### View logs:
Check the console where `npm start` is running

### Stop the server:
Press `Ctrl+C` in the terminal

## 📁 Project Structure

```
shiftswap/
├── public/              # Frontend (HTML, CSS, JS)
├── src/
│   ├── models/          # Database models
│   ├── services/        # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & error handling
│   └── utils/           # Utilities & demo data
├── migrations/          # Database schema
├── tests/               # Test suite
├── config/              # Configuration
├── data/                # SQLite database files
├── server.js            # Application entry
└── architecture.md      # Technical documentation
```

## 🎯 Key Features Implemented

### Business Logic
- ✅ Manager approval required before finalizing any swap
- ✅ Employees can cancel claims before approval
- ✅ Overtime risk flagging (>40 hours/week)
- ✅ Escalation alerts (4 hours before unclaimed shifts)
- ✅ Complete audit trail of all actions

### Security
- ✅ Session-based authentication
- ✅ Role-based access control (employee, manager, admin)
- ✅ SQL injection protection (parameterized queries)
- ✅ Input validation

### Data Export
- ✅ CSV export of audit trail
- ✅ 90-day historical data support
- ✅ Compliance-ready reporting

## 📚 Documentation

- **Architecture**: See `architecture.md` for technical details
- **Requirements**: See `requirements.md` for feature specifications
- **Build Summary**: See `BUILD_SUMMARY.md` for build details

## 🚀 Next Steps

1. **Try the Demo**: Login and test the workflows
2. **Review the UI**: Check out employee and manager dashboards
3. **Test Scenarios**:
   - Post a shift as an employee
   - Claim a shift as another employee
   - Approve/reject as a manager
   - View audit trail in reports
   - Export to CSV

4. **Customize**:
   - Add your company branding
   - Configure SMS notifications (optional)
   - Set up production database
   - Deploy to your hosting platform

## 💡 Tips

- **Demo Mode** is great for testing and demonstrations
- The **demo data resets** each time the server starts in demo mode
- For **production**, set up PostgreSQL or MySQL and disable demo mode
- **Overtime flags** help managers make informed decisions (doesn't auto-block)
- **Audit trail** captures everything for compliance and troubleshooting

## 🎊 Success!

Your ShiftSwap application is complete and ready to use!

Built with ❤️ using 5 specialized Codex-powered agents working in parallel.

---

**Need Help?**
- Check `architecture.md` for technical architecture
- Review `BUILD_SUMMARY.md` for component details
- All code is well-documented with JSDoc comments
