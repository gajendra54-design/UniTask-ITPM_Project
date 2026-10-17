/**
 * Frontend Validation Utilities
 * Centralized validation for all forms
 */

// Email validation
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

// Password validation
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  return { valid: true, error: '' };
};

// Name validation
export const validateName = (name) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Name is required' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: 'Name must be less than 50 characters' };
  }
  return { valid: true, error: '' };
};

// Title validation
export const validateTitle = (title) => {
  const trimmed = title.trim();
  if (!trimmed) {
    return { valid: false, error: 'Title is required' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'Title must be at least 3 characters' };
  }
  if (trimmed.length > 200) {
    return { valid: false, error: 'Title must be less than 200 characters' };
  }
  return { valid: true, error: '' };
};

// URL validation
export const validateURL = (url) => {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, error: 'URL is required' };
  }
  try {
    // If URL doesn't start with http, prepend https://
    const urlToTest = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    new URL(urlToTest);
    return { valid: true, error: '' };
  } catch {
    return { valid: false, error: 'Please enter a valid URL' };
  }
};

// Date validation (ensuring future date or today)
export const validateDate = (dateString) => {
  if (!dateString) {
    return { valid: false, error: 'Date is required' };
  }
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return { valid: false, error: 'Due date must be today or in the future' };
  }
  return { valid: true, error: '' };
};

// Invite code validation
export const validateInviteCode = (code) => {
  const trimmed = code.trim();
  if (!trimmed) {
    return { valid: false, error: 'Invite code is required' };
  }
  if (trimmed.length < 4) {
    return { valid: false, error: 'Invite code must be at least 4 characters' };
  }
  return { valid: true, error: '' };
};

// Usage limit validation
export const validateUsageLimit = (limit) => {
  if (!limit) {
    return { valid: true, error: '', value: null }; // null = unlimited
  }
  const num = parseInt(limit);
  if (isNaN(num)) {
    return { valid: false, error: 'Usage limit must be a number' };
  }
  if (num <= 0) {
    return { valid: false, error: 'Usage limit must be greater than 0' };
  }
  if (num > 1000) {
    return { valid: false, error: 'Usage limit cannot exceed 1000' };
  }
  return { valid: true, error: '', value: num };
};

// File validation
export const validateFile = (file, maxSizeMB = 10) => {
  if (!file) {
    return { valid: false, error: 'File is required' };
  }

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed. Supported: PDF, Office, Images, Text, ZIP' };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  return { valid: true, error: '' };
};

// Task form validation
export const validateTaskForm = (formData) => {
  const errors = {};

  // Title
  const titleValidation = validateTitle(formData.title);
  if (!titleValidation.valid) errors.title = titleValidation.error;

  // Due date
  if (formData.dueDate) {
    const dateValidation = validateDate(formData.dueDate);
    if (!dateValidation.valid) errors.dueDate = dateValidation.error;
  }

  // Description
  if (formData.description && formData.description.trim().length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }

  return errors;
};

// Group form validation
export const validateGroupForm = (formData) => {
  const errors = {};

  // Name
  const nameValidation = validateName(formData.name);
  if (!nameValidation.valid) errors.name = nameValidation.error;

  // Description
  if (formData.description && formData.description.trim().length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  return errors;
};

// Resource form validation
export const validateResourceForm = (formData, resourceType, file) => {
  const errors = {};

  // Title
  const titleValidation = validateTitle(formData.title);
  if (!titleValidation.valid) errors.title = titleValidation.error;

  if (resourceType === 'file') {
    // File validation
    if (!file) {
      errors.file = 'Please select a file';
    } else {
      const fileValidation = validateFile(file);
      if (!fileValidation.valid) errors.file = fileValidation.error;
    }
  } else {
    // URL validation
    const urlValidation = validateURL(formData.url);
    if (!urlValidation.valid) errors.url = urlValidation.error;
  }

  // Tags validation
  if (formData.tags && formData.tags.trim().length > 200) {
    errors.tags = 'Tags must be less than 200 characters';
  }

  // Description validation
  if (formData.description && formData.description.trim().length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  return errors;
};

// Auth form validation
export const validateLoginForm = (email, password) => {
  const errors = {};

  if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return errors;
};

export const validateRegisterForm = (name, email, password) => {
  const errors = {};

  const nameValidation = validateName(name);
  if (!nameValidation.valid) errors.name = nameValidation.error;

  if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email';
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) errors.password = passwordValidation.error;

  return errors;
};

// Utility to check if object has errors
export const hasErrors = (errorObject) => {
  return Object.keys(errorObject).length > 0;
};

// Get formatted error message
export const getErrorMessage = (errors, field) => {
  return errors[field] || '';
};
