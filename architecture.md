# ShiftSwap Technical Architecture

## Overview
ShiftSwap is a web-based shift management application enabling employees to post, claim, and manage shift coverage requests with manager approval workflows. The architecture prioritizes simplicity, maintainability, and ease of deployment for an MVP while supporting future scalability.

## Technology Stack

### Frontend
- **JavaScript (ES6+)**: Core application logic
- **HTML5**: Semantic markup and structure
- **CSS3**: Custom styling and layouts
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Vanilla JS**: No framework dependencies for MVP to minimize complexity

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **JavaScript**: Server-side business logic

### Database
**Production Options (Configurable):**
- **PostgreSQL**: Primary production database (recommended)
- **MySQL**: Alternative production database option

**Development/Demo Mode:**
- **SQLite**: Bundled lightweight database for demo data and local development
- Enables immediate testing without external database setup

### Additional Libraries
- **better-sqlite3**: Fast, synchronous SQLite3 bindings for Node.js
- **pg**: PostgreSQL client for Node.js
- **mysql2**: MySQL client for Node.js
- **dotenv**: Environment configuration management
- **bcrypt**: Password hashing (if authentication expanded beyond employee ID)
- **express-session**: Session management
- **cookie-parser**: Cookie handling

## Architecture Patterns

### Application Architecture
```
┌─────────────────────────────────────────────┐
│            Browser (Client)                  │
│  ┌──────────────────────────────────────┐   │
│  │   HTML/CSS/Tailwind UI Layer         │   │
│  │   JavaScript Application Logic       │   │
│  └──────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
                   │
┌──────────────────▼──────────────────────────┐
│         Express.js Server (Node.js)          │
│  ┌──────────────────────────────────────┐   │
│  │   Routes Layer                       │   │
│  │   - /api/shifts                      │   │
│  │   - /api/claims                      │   │
│  │   - /api/approvals                   │   │
│  │   - /api/users                       │   │
│  └───────────────┬──────────────────────┘   │
│                  │                           │
│  ┌───────────────▼──────────────────────┐   │
│  │   Business Logic Layer               │   │
│  │   - ShiftService                     │   │
│  │   - ClaimService                     │   │
│  │   - ApprovalService                  │   │
│  │   - NotificationService              │   │
│  │   - AuditService                     │   │
│  └───────────────┬──────────────────────┘   │
│                  │                           │
│  ┌───────────────▼──────────────────────┐   │
│  │   Data Access Layer                  │   │
│  │   - Database abstraction             │   │
│  │   - Connection pooling               │   │
│  └───────────────┬──────────────────────┘   │
└──────────────────┼──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Database Layer                       │
│  ┌──────────────────────────────────────┐   │
│  │  PostgreSQL / MySQL / SQLite         │   │
│  │  (configurable based on mode)        │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Database Architecture

#### Core Tables

**users**
- id (PRIMARY KEY)
- employee_id (UNIQUE, NOT NULL)
- name (NOT NULL)
- email
- phone (for SMS notifications)
- role (employee, manager, admin)
- created_at
- updated_at

**shifts**
- id (PRIMARY KEY)
- posted_by (FK → users.id)
- shift_date (NOT NULL)
- start_time (NOT NULL)
- end_time (NOT NULL)
- role_name (NOT NULL)
- location
- status (open, claimed, approved, rejected, cancelled)
- created_at
- updated_at

**claims**
- id (PRIMARY KEY)
- shift_id (FK → shifts.id)
- claimed_by (FK → users.id)
- claim_date
- status (pending, approved, rejected, cancelled)
- created_at
- updated_at

**approvals**
- id (PRIMARY KEY)
- claim_id (FK → claims.id)
- manager_id (FK → users.id)
- decision (approved, rejected)
- decision_date
- notes
- created_at

**audit_log**
- id (PRIMARY KEY)
- user_id (FK → users.id)
- action (shift_posted, shift_claimed, claim_cancelled, claim_approved, claim_rejected, shift_escalated)
- entity_type (shift, claim, approval)
- entity_id
- details (JSON/TEXT)
- timestamp
- ip_address

**notifications**
- id (PRIMARY KEY)
- user_id (FK → users.id)
- type (sms, push, email)
- message
- status (pending, sent, failed)
- sent_at
- created_at

**overtime_tracking**
- id (PRIMARY KEY)
- user_id (FK → users.id)
- week_start_date
- total_hours
- flagged (BOOLEAN)
- created_at
- updated_at

## Key Features & Implementation

### 1. Demo Data Toggle
**Implementation:**
- Environment variable: `DEMO_MODE=true|false`
- When enabled, automatically:
  - Switches to SQLite database
  - Populates database with sample users, shifts, and claims
  - Shows "Demo Mode" indicator in UI
  - Allows data reset without affecting production

**Demo Data Includes:**
- 10-15 sample employees
- 5-10 managers
- 20-30 historical shifts with various statuses
- Sample claims and approvals
- Realistic audit trail data

### 2. Database Configuration
**Configuration File:** `config/database.js`
```javascript
{
  mode: process.env.DB_MODE, // 'sqlite', 'postgres', 'mysql'
  postgres: {
    host, port, database, user, password
  },
  mysql: {
    host, port, database, user, password
  },
  sqlite: {
    filename: './data/shiftswap.db'
  }
}
```

### 3. User Authentication
**MVP Approach:**
- Simple employee ID login
- Session-based authentication
- Role-based access control (employee, manager, admin)

**Future Enhancement Paths:**
- SSO integration
- Multi-factor authentication
- OAuth 2.0 providers

### 4. Manager Approval Workflow
**States:**
1. Shift Posted (status: open)
2. Shift Claimed (status: claimed, claim status: pending)
3. Manager Reviews (approval interface)
4. Decision Made (claim status: approved/rejected)
5. Shift Finalized (shift status: approved) OR returned to open (if rejected)

### 5. Notifications
**V1 Priority: SMS**
- Integration point for SMS gateway (Twilio/similar)
- Notification triggers:
  - New shift posted
  - Shift claimed
  - Approval/rejection
  - Claim cancellation
  - Escalation alert (4 hours before unclaimed shift)

**Optional: Push Notifications**
- Web Push API for browser notifications
- Requires user permission
- Fallback to SMS if unavailable

### 6. Overtime Risk Calculation
**Logic:**
- Track weekly hours per employee
- Calculate proposed hours if claim approved
- Flag if total exceeds 40 hours/week
- Display warning to manager during approval
- Does NOT auto-block in V1

### 7. Audit Trail & Export
**Audit Logging:**
- Every action logged with timestamp, user, and details
- Immutable audit records
- Minimum 90-day retention

**CSV Export:**
- Date range filter
- Includes all audit fields
- Export action itself is audited

## Directory Structure
```
shiftswap/
├── config/
│   ├── database.js          # Database configuration
│   └── environment.js       # Environment settings
├── public/
│   ├── css/
│   │   └── styles.css       # Custom CSS + Tailwind
│   ├── js/
│   │   ├── app.js           # Main application logic
│   │   ├── shifts.js        # Shift management
│   │   ├── claims.js        # Claim management
│   │   ├── approvals.js     # Manager approval UI
│   │   └── utils.js         # Utility functions
│   └── index.html           # Main HTML entry
├── src/
│   ├── routes/
│   │   ├── shifts.js        # Shift routes
│   │   ├── claims.js        # Claim routes
│   │   ├── approvals.js     # Approval routes
│   │   ├── users.js         # User routes
│   │   └── auth.js          # Authentication routes
│   ├── services/
│   │   ├── shiftService.js  # Shift business logic
│   │   ├── claimService.js  # Claim business logic
│   │   ├── approvalService.js # Approval business logic
│   │   ├── notificationService.js # Notifications
│   │   ├── overtimeService.js # Overtime calculations
│   │   └── auditService.js  # Audit logging
│   ├── models/
│   │   ├── database.js      # Database connection
│   │   ├── shift.js         # Shift data model
│   │   ├── claim.js         # Claim data model
│   │   ├── user.js          # User data model
│   │   └── audit.js         # Audit data model
│   ├── middleware/
│   │   ├── auth.js          # Authentication middleware
│   │   └── errorHandler.js  # Error handling
│   └── utils/
│       ├── demoData.js      # Demo data generator
│       └── csvExport.js     # CSV export utility
├── data/
│   └── shiftswap.db         # SQLite database (demo mode)
├── migrations/
│   └── init.sql             # Database schema initialization
├── tests/
│   ├── shifts.test.js
│   ├── claims.test.js
│   └── approvals.test.js
├── .env.example             # Example environment variables
├── .gitignore
├── package.json
├── server.js                # Application entry point
└── README.md
```

## Security Considerations

### Authentication & Authorization
- Session-based authentication with secure cookies
- Role-based access control (RBAC)
- Employee ID validation
- Manager privileges for approval actions

### Data Protection
- Parameterized queries to prevent SQL injection
- Input validation and sanitization
- Secure session storage
- HTTPS in production

### Audit & Compliance
- Complete audit trail of all actions
- 90-day minimum data retention
- Export capabilities for compliance reporting
- Immutable audit logs

## Deployment Strategy

### Development
- SQLite with demo data
- Hot reload for rapid development
- Mock notification services

### Production
- PostgreSQL or MySQL
- Environment-based configuration
- Connection pooling
- SMS gateway integration
- Proper logging and monitoring

### Environment Variables
```
NODE_ENV=development|production
DB_MODE=sqlite|postgres|mysql
DEMO_MODE=true|false

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=shiftswap
POSTGRES_USER=shiftswap_user
POSTGRES_PASSWORD=secure_password

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=shiftswap
MYSQL_USER=shiftswap_user
MYSQL_PASSWORD=secure_password

# Session
SESSION_SECRET=random_secure_string

# Notifications (optional for MVP)
SMS_API_KEY=your_twilio_key
SMS_API_SECRET=your_twilio_secret
```

## Scalability Considerations

### Current MVP
- Single server deployment
- File-based sessions (or database sessions)
- Synchronous processing
- Direct database queries

### Future Enhancements
- Horizontal scaling with load balancer
- Redis for session storage
- Message queue for notifications (RabbitMQ/Redis)
- Read replicas for reporting
- Caching layer (Redis/Memcached)
- Microservices architecture (if needed)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Employee login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Shifts
- `GET /api/shifts` - List shifts (with filters)
- `GET /api/shifts/:id` - Get shift details
- `POST /api/shifts` - Post new shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Cancel shift (if no claims)

### Claims
- `GET /api/claims` - List claims (by user or shift)
- `POST /api/claims` - Claim a shift
- `DELETE /api/claims/:id` - Cancel claim (before approval)
- `GET /api/claims/:id` - Get claim details

### Approvals
- `GET /api/approvals/pending` - Get pending approvals (managers)
- `POST /api/approvals/:claimId/approve` - Approve claim
- `POST /api/approvals/:claimId/reject` - Reject claim

### Reports
- `GET /api/reports/audit` - Get audit trail
- `GET /api/reports/export` - Export CSV
- `GET /api/reports/overtime-risk` - Get overtime flagged users

### Users
- `GET /api/users/me` - Get current user info
- `GET /api/users` - List users (managers only)

## UI Components

### Employee View
- **Dashboard**: Open shifts, my posted shifts, my claims
- **Post Shift**: Form to create shift coverage request
- **Claim Shift**: Browse and claim available shifts
- **My Activity**: View claim status and history

### Manager View
- **Dashboard**: All pending approvals, escalations
- **Approval Queue**: Review claims with overtime flags
- **Team Overview**: See all shifts and swaps by team member
- **Reports**: Access audit trail and exports

### Shared Components
- **Navigation Bar**: Role-based menu
- **Notification Center**: Recent alerts
- **Demo Mode Toggle**: Switch between demo/production (dev only)
- **Status Indicators**: Visual status badges

## Testing Strategy

### Unit Tests
- Service layer business logic
- Database model operations
- Utility functions

### Integration Tests
- API endpoint responses
- Database transactions
- Authentication flows

### Manual Testing
- End-to-end user workflows
- Manager approval scenarios
- Demo data population
- Database switching

## Monitoring & Logging

### Application Logging
- Request/response logging
- Error tracking
- Performance metrics
- Audit trail queries

### Database Monitoring
- Connection pool status
- Query performance
- Failed transactions

## Open Questions & Future Considerations

1. **SMS Gateway Selection**: Twilio, AWS SNS, or alternative?
2. **Hosting Environment**: Cloud provider preferences?
3. **Backup Strategy**: Database backup frequency and retention?
4. **User Onboarding**: How will employee data be initially populated?
5. **Time Zone Handling**: Single time zone or multi-zone support?
6. **Browser Support**: Modern browsers only, or IE11 compatibility?

## Success Metrics

- **Performance**: Page load < 2 seconds
- **Availability**: 99% uptime during pilot
- **User Adoption**: 80% of target users create/claim at least one shift
- **Approval Speed**: 90% of claims approved/rejected within 24 hours
- **Data Integrity**: Zero audit trail gaps

---

**Document Version**: 1.0  
**Last Updated**: 2026-07-06  
**Author**: ShiftSwap Dev Team  
**Status**: Approved for MVP Implementation
