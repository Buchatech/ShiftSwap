const db = require('../services/inMemoryDb');
const { validateDateRange } = require('./validators');

const DEFAULT_AUDIT_HEADERS = [
  { key: 'id', label: 'ID' },
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'user_id', label: 'User ID' },
  { key: 'action', label: 'Action' },
  { key: 'entity_type', label: 'Entity Type' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'details', label: 'Details' },
  { key: 'ip_address', label: 'IP Address' }
];

/**
 * Escape a single CSV value.
 *
 * @param {unknown} value - Value to escape.
 * @returns {string}
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value).replace(/"/g, '""');
  const needsQuotes = /[",\n\r]/.test(stringValue);
  return needsQuotes ? `"${stringValue}"` : stringValue;
}

/**
 * Formats date-like values for export.
 *
 * @param {unknown} value - Value to format.
 * @returns {string}
 */
function formatExportValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime()) && (value.includes('T') || value.includes('-'))) {
      return asDate.toISOString();
    }
  }

  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }

  return value === null || value === undefined ? '' : String(value);
}

/**
 * Convert records to CSV.
 *
 * @param {object[]} data - Data rows.
 * @param {(string|{key:string,label:string})[]} headers - Header definitions.
 * @returns {string}
 */
function generateCSV(data, headers) {
  if (!Array.isArray(data)) {
    throw new Error('CSV generation expects data to be an array.');
  }

  if (!Array.isArray(headers) || headers.length === 0) {
    throw new Error('CSV generation requires at least one header.');
  }

  const normalizedHeaders = headers.map((header) => (
    typeof header === 'string'
      ? { key: header, label: header }
      : { key: header.key, label: header.label || header.key }
  ));

  const headerLine = normalizedHeaders
    .map((header) => escapeCsvValue(header.label))
    .join(',');

  const rowLines = data.map((row) => normalizedHeaders
    .map((header) => escapeCsvValue(formatExportValue(row ? row[header.key] : '')))
    .join(','));

  return [headerLine, ...rowLines].join('\n');
}

/**
 * Export audit trail records in CSV format for a date range.
 *
 * @param {string|Date} startDate - Inclusive range start.
 * @param {string|Date} endDate - Inclusive range end.
 * @param {string} [format='csv'] - Export format, currently csv only.
 * @param {{ database?: object, records?: object[] }} [options={}] - Optional source overrides.
 * @returns {string}
 */
function exportAuditTrail(startDate, endDate, format = 'csv', options = {}) {
  const dateValidation = validateDateRange(startDate, endDate);
  if (!dateValidation.isValid) {
    throw new Error(`Invalid date range: ${dateValidation.errors.join(' ')}`);
  }

  if (format.toLowerCase() !== 'csv') {
    throw new Error('Unsupported export format. Only csv is currently supported.');
  }

  const sourceDb = options.database || db;
  const sourceRecords = Array.isArray(options.records)
    ? options.records
    : Array.from((sourceDb.auditLogs || new Map()).values());

  const filtered = sourceRecords
    .filter((record) => {
      const timestamp = new Date(record.timestamp);
      return !Number.isNaN(timestamp.getTime())
        && timestamp >= dateValidation.startDate
        && timestamp <= dateValidation.endDate;
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((record) => ({
      ...record,
      details: typeof record.details === 'object' && record.details !== null
        ? JSON.stringify(record.details)
        : record.details
    }));

  return generateCSV(filtered, DEFAULT_AUDIT_HEADERS);
}

module.exports = {
  exportAuditTrail,
  generateCSV
};
