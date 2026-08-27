# ShiftSwap

A web application that helps hourly employees request shift coverage and pick up available shifts, with manager approval workflows

## Features

- 🔄 **Shift Posting**: Employees can post shifts they need covered
- 👋 **Shift Claiming**: Employees can browse and claim available shifts
- ✅ **Manager Approval**: Managers review and approve/reject shift swaps
- 📊 **Overtime Tracking**: Flags when swaps may push employees over 40 hours/week
- 📝 **Audit Trail**: Complete history of all swap activities for 90+ days
- 📤 **CSV Export**: Export swap history for payroll and compliance
- 🔔 **Notifications**: SMS notifications for key events (V1)
- 🎭 **Demo Mode**: Built-in demo data for testing and evaluation

## Tech Stack

- **Frontend**: JavaScript (ES6+), HTML5, CSS3, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: SQLite (demo), PostgreSQL or MySQL (production)

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Buchatech/ShiftSwap.git
cd ShiftSwap
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser to: `http://localhost:3000`

## Demo Mode

To run with demo data (uses SQLite):

1. Set in `.env`:
```
DEMO_MODE=true
DB_MODE=sqlite
```

2. Demo data includes:
   - Sample employees and managers
   - Historical shifts in various states
   - Example claims and approvals
   - Realistic audit trail

## Production Setup

### PostgreSQL

1. Create a PostgreSQL database
2. Configure `.env`:
```
DB_MODE=postgres
DEMO_MODE=false
POSTGRES_HOST=your-host
POSTGRES_PORT=5432
POSTGRES_DB=shiftswap
POSTGRES_USER=your-user
POSTGRES_PASSWORD=your-password
```

### MySQL

1. Create a MySQL database
2. Configure `.env`:
```
DB_MODE=mysql
DEMO_MODE=false
MYSQL_HOST=your-host
MYSQL_PORT=3306
MYSQL_DB=shiftswap
MYSQL_USER=your-user
MYSQL_PASSWORD=your-password
```

## Project Structure

```
shiftswap/
├── config/           # Configuration files
├── public/           # Static files (HTML, CSS, JS)
├── src/
│   ├── routes/       # Express route handlers
│   ├── services/     # Business logic layer
│   ├── models/       # Database models
│   ├── middleware/   # Express middleware
│   └── utils/        # Utility functions
├── migrations/       # Database migrations
├── tests/            # Test files
└── server.js         # Application entry point
```

## API Documentation

### Authentication
- `POST /api/auth/login` - Login with employee ID
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Shifts
- `GET /api/shifts` - List all shifts
- `GET /api/shifts/:id` - Get shift details
- `POST /api/shifts` - Post a new shift
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

## Testing

Run tests:
```bash
npm test
```

Watch mode for development:
```bash
npm run test:watch
```

## User Roles

### Employee
- Post shifts for coverage
- Claim available shifts
- Cancel claims before approval
- View personal shift history

### Manager
- All employee capabilities
- Approve or reject shift claims
- View team-wide shift activity
- Access reports and exports
- Receive escalation alerts

### Admin
- All manager capabilities
- User management
- System configuration

## Security

- Session-based authentication
- Role-based access control
- SQL injection protection via parameterized queries
- Input validation and sanitization
- Audit logging of all actions

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## Roadmap

### V1 (Current)
- ✅ Core shift posting and claiming
- ✅ Manager approval workflow
- ✅ Basic notifications (SMS)
- ✅ Audit trail and CSV export

### V2 (Future)
- [ ] Push notifications
- [ ] Slack integration
- [ ] SSO authentication
- [ ] Payroll system integration
- [ ] Advanced reporting dashboard
- [ ] Mobile app

---

Built with ❤️ by Buchatech
