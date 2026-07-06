class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ServiceError(`${fieldName} is required and must be a non-empty string`);
  }
}

function assertObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ServiceError(`${fieldName} must be an object`);
  }
}

function assertNumber(value, fieldName) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ServiceError(`${fieldName} must be a valid number`);
  }
}

function toDate(value, fieldName) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ServiceError(`${fieldName} must be a valid date`);
  }
  return date;
}

function nextId(counterName, prefix) {
  if (!nextId.counters[counterName]) {
    nextId.counters[counterName] = 1;
  }
  const value = nextId.counters[counterName];
  nextId.counters[counterName] += 1;
  return `${prefix}_${value}`;
}
nextId.counters = {};

function copyRecord(record) {
  return JSON.parse(JSON.stringify(record));
}

module.exports = {
  ServiceError,
  assertNonEmptyString,
  assertObject,
  assertNumber,
  toDate,
  nextId,
  copyRecord
};
