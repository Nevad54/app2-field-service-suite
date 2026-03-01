// ============== VALIDATION SCHEMAS ==============

// Validation helpers
const isString = (val) => typeof val === 'string';
const isNumber = (val) => typeof val === 'number' && !isNaN(val);
const isBoolean = (val) => typeof val === 'boolean';
const isDate = (val) => val === null || !isNaN(Date.parse(val));
const isArray = (val) => Array.isArray(val);
const isObject = (val) => val !== null && typeof val === 'object' && !Array.isArray(val);
const isEmpty = (val) => val === null || val === undefined || val === '';

// Validation rules for each endpoint
const validationSchemas = {
  // Auth schemas
  login: {
    username: { required: true, type: 'string', minLength: 1 },
    password: { required: true, type: 'string', minLength: 1 }
  },

  // Project schemas
  createProject: {
    title: { required: true, type: 'string', minLength: 1, maxLength: 200 },
    description: { required: false, type: 'string', maxLength: 1000 },
    start_date: { required: false, type: 'date' },
    end_date: { required: false, type: 'date' }
  },

  updateProject: {
    title: { required: false, type: 'string', minLength: 1, maxLength: 200 },
    description: { required: false, type: 'string', maxLength: 1000 },
    start_date: { required: false, type: 'date', nullable: true },
    end_date: { required: false, type: 'date', nullable: true },
    status: { required: false, type: 'string', enum: ['planning', 'active', 'in_progress', 'completed', 'delayed', 'on_hold'] }
  },

  // Task schemas
  createTask: {
    project_id: { required: true, type: 'string', minLength: 1 },
    parent_task_id: { required: false, type: 'string', nullable: true },
    name: { required: true, type: 'string', minLength: 1, maxLength: 200 },
    start_date: { required: false, type: 'date', nullable: true },
    end_date: { required: false, type: 'date', nullable: true },
    progress_percent: { required: false, type: 'number', min: 0, max: 100 },
    weight: { required: false, type: 'number', min: 0.1, max: 100 },
    notes: { required: false, type: 'string', maxLength: 2000 },
    sort_order: { required: false, type: 'number' }
  },

  updateTask: {
    name: { required: false, type: 'string', minLength: 1, maxLength: 200 },
    parent_task_id: { required: false, type: 'string', nullable: true },
    start_date: { required: false, type: 'date', nullable: true },
    end_date: { required: false, type: 'date', nullable: true },
    progress_percent: { required: false, type: 'number', min: 0, max: 100 },
    weight: { required: false, type: 'number', min: 0.1, max: 100 },
    notes: { required: false, type: 'string', maxLength: 2000 },
    sort_order: { required: false, type: 'number' }
  },

  updateTaskProgress: {
    progress_percent: { required: true, type: 'number', min: 0, max: 100 }
  },

  updateTaskDates: {
    start_date: { required: true, type: 'date', nullable: true },
    end_date: { required: true, type: 'date', nullable: true }
  },

  // Job schemas
  createJob: {
    title: { required: true, type: 'string', minLength: 1, maxLength: 200 },
    description: { required: false, type: 'string', maxLength: 2000 },
    customerId: { required: true, type: 'string', minLength: 1 },
    location: { required: false, type: 'string', maxLength: 200 },
    priority: { required: false, type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
    scheduledDate: { required: false, type: 'date' }
  },

  updateJob: {
    title: { required: false, type: 'string', minLength: 1, maxLength: 200 },
    description: { required: false, type: 'string', maxLength: 2000 },
    status: { required: false, type: 'string', enum: ['new', 'assigned', 'in-progress', 'completed', 'cancelled'] },
    priority: { required: false, type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
    assignedTo: { required: false, type: 'string', nullable: true },
    scheduledDate: { required: false, type: 'date', nullable: true }
  },

  // Customer schemas
  createCustomer: {
    name: { required: true, type: 'string', minLength: 1, maxLength: 200 },
    email: { required: true, type: 'string', format: 'email', maxLength: 200 },
    phone: { required: false, type: 'string', maxLength: 50 },
    address: { required: false, type: 'string', maxLength: 500 }
  },

  updateCustomer: {
    name: { required: false, type: 'string', minLength: 1, maxLength: 200 },
    email: { required: false, type: 'string', format: 'email', maxLength: 200 },
    phone: { required: false, type: 'string', maxLength: 50 },
    address: { required: false, type: 'string', maxLength: 500 }
  },

  // Invoice schemas
  createInvoice: {
    jobId: { required: true, type: 'string', minLength: 1 },
    customerId: { required: true, type: 'string', minLength: 1 },
    amount: { required: true, type: 'number', min: 0 },
    description: { required: false, type: 'string', maxLength: 1000 }
  },

  updateInvoice: {
    status: { required: false, type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] },
    amount: { required: false, type: 'number', min: 0 },
    description: { required: false, type: 'string', maxLength: 1000 }
  }
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Main validation function
const validate = (schemaName, data) => {
  const schema = validationSchemas[schemaName];
  if (!schema) {
    return { valid: false, errors: [`Unknown schema: ${schemaName}`] };
  }

  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required
    if (rules.required && isEmpty(value)) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip further validation if not required and empty
    if (!rules.required && isEmpty(value)) {
      continue;
    }

    // Check nullable
    if (value === null && !rules.nullable && rules.required) {
      errors.push(`${field} cannot be null`);
      continue;
    }

    // Type validation
    if (rules.type) {
      switch (rules.type) {
        case 'string':
          if (!isString(value)) {
            errors.push(`${field} must be a string`);
          } else {
            if (rules.minLength && value.length < rules.minLength) {
              errors.push(`${field} must be at least ${rules.minLength} characters`);
            }
            if (rules.maxLength && value.length > rules.maxLength) {
              errors.push(`${field} must be at most ${rules.maxLength} characters`);
            }
          }
          break;
        case 'number':
          if (!isNumber(value)) {
            errors.push(`${field} must be a number`);
          } else {
            if (rules.min !== undefined && value < rules.min) {
              errors.push(`${field} must be at least ${rules.min}`);
            }
            if (rules.max !== undefined && value > rules.max) {
              errors.push(`${field} must be at most ${rules.max}`);
            }
          }
          break;
        case 'boolean':
          if (!isBoolean(value)) {
            errors.push(`${field} must be a boolean`);
          }
          break;
        case 'date':
          if (!isDate(value)) {
            errors.push(`${field} must be a valid date`);
          }
          break;
      }

      // Format validation
      if (rules.format === 'email' && isString(value)) {
        if (!validateEmail(value)) {
          errors.push(`${field} must be a valid email`);
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  validate,
  validationSchemas
};
