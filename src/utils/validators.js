/**
 * Validate employee identifier formatting.
 * Accepted formats: EMP1234, EMP-1234, MGR1234, MGR-1234, ADM1234, ADM-1234.
 *
 * @param {string} employeeId - Employee ID string to validate.
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateEmployeeId(employeeId) {
  const errors = [];

  if (typeof employeeId !== 'string' || employeeId.trim().length === 0) {
    errors.push('Employee ID is required.');
    return { isValid: false, errors };
  }

  const normalized = employeeId.trim().toUpperCase();
  const validPattern = /^(EMP|MGR|ADM)-?\d{4,6}$/;

  if (!validPattern.test(normalized)) {
    errors.push('Employee ID must look like EMP-1234, MGR-1234, or ADM-1234.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate a date range and ensure start <= end.
 *
 * @param {string|Date} startDate - Inclusive start date.
 * @param {string|Date} endDate - Inclusive end date.
 * @returns {{ isValid: boolean, errors: string[], startDate?: Date, endDate?: Date }}
 */
function validateDateRange(startDate, endDate) {
  const errors = [];
  const parsedStart = new Date(startDate);
  const parsedEnd = new Date(endDate);

  if (Number.isNaN(parsedStart.getTime())) {
    errors.push('Start date is invalid.');
  }

  if (Number.isNaN(parsedEnd.getTime())) {
    errors.push('End date is invalid.');
  }

  if (errors.length === 0 && parsedEnd < parsedStart) {
    errors.push('End date must be on or after start date.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    ...(errors.length === 0 ? { startDate: parsedStart, endDate: parsedEnd } : {})
  };
}

/**
 * Validate a shift time range in 24-hour HH:mm format.
 * Supports overnight shifts by allowing end time to be earlier than start time.
 *
 * @param {string} startTime - Shift start time (HH:mm).
 * @param {string} endTime - Shift end time (HH:mm).
 * @returns {{ isValid: boolean, errors: string[], durationMinutes?: number }}
 */
function validateTimeRange(startTime, endTime) {
  const errors = [];
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timePattern.test(startTime || '')) {
    errors.push('Start time must use 24-hour HH:mm format.');
  }

  if (!timePattern.test(endTime || '')) {
    errors.push('End time must use 24-hour HH:mm format.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startTotal = (startHour * 60) + startMinute;
  const endTotal = (endHour * 60) + endMinute;
  let durationMinutes = endTotal - startTotal;

  if (durationMinutes <= 0) {
    durationMinutes += 24 * 60;
  }

  if (durationMinutes < 30) {
    errors.push('Shift duration must be at least 30 minutes.');
  }

  if (durationMinutes > 16 * 60) {
    errors.push('Shift duration cannot exceed 16 hours.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    durationMinutes
  };
}

/**
 * Validate posted shift payload.
 *
 * @param {object} shiftData - Shift posting payload.
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateShiftData(shiftData) {
  const errors = [];

  if (!shiftData || typeof shiftData !== 'object') {
    return {
      isValid: false,
      errors: ['Shift payload is required.']
    };
  }

  const requiredFields = ['posted_by', 'shift_date', 'start_time', 'end_time', 'role_name'];
  requiredFields.forEach((field) => {
    if (shiftData[field] === undefined || shiftData[field] === null || String(shiftData[field]).trim() === '') {
      errors.push(`${field} is required.`);
    }
  });

  if (shiftData.employee_id) {
    const employeeIdValidation = validateEmployeeId(shiftData.employee_id);
    errors.push(...employeeIdValidation.errors);
  }

  if (shiftData.shift_date) {
    const dateValidation = validateDateRange(shiftData.shift_date, shiftData.shift_date);
    errors.push(...dateValidation.errors);
  }

  if (shiftData.start_time && shiftData.end_time) {
    const timeValidation = validateTimeRange(shiftData.start_time, shiftData.end_time);
    errors.push(...timeValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateShiftData,
  validateEmployeeId,
  validateDateRange,
  validateTimeRange
};
