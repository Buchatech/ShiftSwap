require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Demo mode indicator middleware
app.use((req, res, next) => {
  res.locals.demoMode = process.env.DEMO_MODE === 'true';
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    demoMode: process.env.DEMO_MODE === 'true',
    dbMode: process.env.DB_MODE || 'sqlite',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/shifts', require('./src/routes/shifts'));
app.use('/api/claims', require('./src/routes/claims'));
app.use('/api/approvals', require('./src/routes/approvals'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/users', require('./src/routes/users'));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('Starting ShiftSwap server...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database Mode: ${process.env.DB_MODE || 'sqlite'}`);
    console.log(`Demo Mode: ${process.env.DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);

    // Initialize database connection
    const database = require('./src/models/database');
    await database.init();

    // Run migrations
    const runMigrations = require('./migrations/run-migrations');
    await runMigrations();

    // Populate demo data if DEMO_MODE is enabled
    if (process.env.DEMO_MODE === 'true') {
      const demoData = require('./src/utils/demoData');
      await demoData.populateDatabase();
      console.log('✅ Demo data populated successfully');
    }

    app.listen(PORT, () => {
      console.log(`\n✅ ShiftSwap server running on http://localhost:${PORT}`);
      console.log(`\n📋 Health check: http://localhost:${PORT}/health`);
      if (process.env.DEMO_MODE === 'true') {
        console.log(`\n🎭 DEMO MODE ACTIVE - Using sample data`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  // TODO: Close database connections
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  // TODO: Close database connections
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
