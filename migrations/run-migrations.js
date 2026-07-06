const fs = require('fs');
const path = require('path');
const db = require('../src/models/database');
const dbConfig = require('../config/database');

function getSqlForMode(fileContents, mode) {
  const marker = `-- @${mode}`;
  const allMarkers = ['-- @sqlite', '-- @postgres', '-- @mysql'];
  const start = fileContents.indexOf(marker);

  if (start === -1) {
    throw new Error(`No SQL block found for mode "${mode}" in init.sql`);
  }

  let end = fileContents.length;
  for (const candidate of allMarkers) {
    if (candidate === marker) {
      continue;
    }
    const markerIndex = fileContents.indexOf(candidate, start + marker.length);
    if (markerIndex !== -1 && markerIndex < end) {
      end = markerIndex;
    }
  }

  return fileContents.substring(start + marker.length, end).trim();
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const prevChar = sql[index - 1];

    if (char === "'" && prevChar !== '\\' && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prevChar !== '\\' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const statement = current.trim();
      if (statement) {
        statements.push(statement);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const trailing = current.trim();
  if (trailing) {
    statements.push(trailing);
  }

  return statements;
}

async function runMigrations() {
  const migrationFile = path.resolve(__dirname, 'init.sql');
  const fileContents = fs.readFileSync(migrationFile, 'utf8');
  const mode = dbConfig.mode;
  const sql = getSqlForMode(fileContents, mode);

  try {
    await db.init();
    const statements = splitSqlStatements(sql);
    for (const statement of statements) {
      await db.query(statement);
    }
    console.log(`Database migrations completed for mode: ${mode}`);
  } catch (error) {
    console.error(`Migration failed for mode ${mode}:`, error.message);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
