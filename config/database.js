const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const demoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
const envMode = String(process.env.DB_MODE || 'sqlite').toLowerCase();
const mode = demoMode ? 'sqlite' : envMode;

const databaseConfig = {
  mode,
  demoMode,
  retry: {
    maxRetries: parseNumber(process.env.DB_MAX_RETRIES, 3),
    initialDelayMs: parseNumber(process.env.DB_RETRY_INITIAL_DELAY_MS, 500),
    maxDelayMs: parseNumber(process.env.DB_RETRY_MAX_DELAY_MS, 5000),
  },
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseNumber(process.env.POSTGRES_PORT, 5432),
    database: process.env.POSTGRES_DB || 'shiftswap',
    user: process.env.POSTGRES_USER || 'shiftswap_user',
    password: process.env.POSTGRES_PASSWORD || '',
    ssl: String(process.env.POSTGRES_SSL || '').toLowerCase() === 'true',
    pool: {
      max: parseNumber(process.env.POSTGRES_POOL_MAX, 10),
      min: parseNumber(process.env.POSTGRES_POOL_MIN, 0),
      idleTimeoutMillis: parseNumber(process.env.POSTGRES_POOL_IDLE_TIMEOUT_MS, 30000),
      connectionTimeoutMillis: parseNumber(process.env.POSTGRES_POOL_CONNECTION_TIMEOUT_MS, 10000),
    },
  },
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseNumber(process.env.MYSQL_PORT, 3306),
    database: process.env.MYSQL_DB || 'shiftswap',
    user: process.env.MYSQL_USER || 'shiftswap_user',
    password: process.env.MYSQL_PASSWORD || '',
    pool: {
      connectionLimit: parseNumber(process.env.MYSQL_POOL_MAX, 10),
      waitForConnections: true,
      queueLimit: parseNumber(process.env.MYSQL_POOL_QUEUE_LIMIT, 0),
      connectTimeout: parseNumber(process.env.MYSQL_CONNECT_TIMEOUT_MS, 10000),
    },
    timezone: process.env.MYSQL_TIMEZONE || 'Z',
  },
  sqlite: {
    filename: path.resolve(process.cwd(), process.env.SQLITE_DB_PATH || '.\\data\\shiftswap.db'),
  },
};

if (!['sqlite', 'postgres', 'mysql'].includes(databaseConfig.mode)) {
  throw new Error(`Unsupported DB_MODE "${databaseConfig.mode}". Use sqlite, postgres, or mysql.`);
}

module.exports = databaseConfig;
