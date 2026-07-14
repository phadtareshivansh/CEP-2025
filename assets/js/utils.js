// Validation & Utility Functions
// Shared across all pages

const Validators = {
  // Email validation
  email: (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value) ? { valid: true } : { valid: false, message: 'Invalid email format' };
  },

  // Required field
  required: (value, fieldName = 'Field') => {
    const trimmed = value?.trim();
    return trimmed ? { valid: true } : { valid: false, message: `${fieldName} is required` };
  },

  // Minimum length
  minLength: (value, min, fieldName = 'Field') => {
    return value.length >= min 
      ? { valid: true } 
      : { valid: false, message: `${fieldName} must be at least ${min} characters` };
  },

  // Maximum length
  maxLength: (value, max, fieldName = 'Field') => {
    return value.length <= max 
      ? { valid: true } 
      : { valid: false, message: `${fieldName} must not exceed ${max} characters` };
  },

  // Password strength
  password: (value) => {
    const checks = {
      length: value.length >= 8,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      number: /\d/.test(value),
      special: /[!@#$%^&*]/.test(value)
    };
    
    const passed = Object.values(checks).filter(Boolean).length;
    if (passed < 3) {
      return { valid: false, message: 'Password must have 8+ chars with upper, lower, number, and special char' };
    }
    return { valid: true };
  },

  // Phone number (Indian)
  phone: (value) => {
    const re = /^[6-9]\d{9}$/;
    return re.test(value) ? { valid: true } : { valid: false, message: 'Invalid Indian phone number' };
  },

  // Roll number format (customize as needed)
  rollNo: (value) => {
    const re = /^[A-Z]{2,4}\d{4,6}$/i;
    return re.test(value) ? { valid: true } : { valid: false, message: 'Invalid roll number format (e.g., AIML2023001)' };
  },

  // Date validation
  date: (value, min = null, max = null) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, message: 'Invalid date' };
    }
    if (min && date < new Date(min)) {
      return { valid: false, message: `Date must be after ${min}` };
    }
    if (max && date > new Date(max)) {
      return { valid: false, message: `Date must be before ${max}` };
    }
    return { valid: true };
  },

  // Number range
  number: (value, min = null, max = null) => {
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, message: 'Must be a number' };
    if (min !== null && num < min) return { valid: false, message: `Must be at least ${min}` };
    if (max !== null && num > max) return { valid: false, message: `Must not exceed ${max}` };
    return { valid: true };
  },

  // Validate multiple rules
  validate: (value, rules) => {
    for (const rule of rules) {
      const result = rule.validator(value, ...(rule.args || []));
      if (!result.valid) return result;
    }
    return { valid: true };
  }
};

// Form validation helper
const FormValidator = {
  // Validate entire form
  validateForm: (formElement) => {
    const errors = [];
    const inputs = formElement.querySelectorAll('[required], [data-validate]');
    
    inputs.forEach(input => {
      const error = FormValidator.validateField(input);
      if (error) {
        errors.push({ field: input, message: error });
        FormValidator.showError(input, error);
      } else {
        FormValidator.clearError(input);
      }
    });
    
    return errors;
  },

  // Validate single field
  validateField: (input) => {
    const value = input.value;
    const rules = [];

    // Required
    if (input.hasAttribute('required')) {
      rules.push({ validator: Validators.required, args: [input.name || input.id || 'Field'] });
    }

    // Data attributes
    if (input.dataset.validate) {
      const validations = input.dataset.validate.split('|');
      validations.forEach(v => {
        const [validator, ...args] = v.split(':');
        if (Validators[validator]) {
          rules.push({ validator: Validators[validator], args: args });
        }
      });
    }

    // Pattern attribute
    if (input.pattern) {
      rules.push({ 
        validator: (val) => new RegExp(input.pattern).test(val) 
          ? { valid: true } 
          : { valid: false, message: input.title || 'Invalid format' }
      });
    }

    // Min/max for numbers
    if (input.type === 'number') {
      if (input.min !== '') rules.push({ validator: Validators.number, args: [parseFloat(input.min), null] });
      if (input.max !== '') rules.push({ validator: Validators.number, args: [null, parseFloat(input.max)] });
    }

    // Min/max length
    if (input.minLength) rules.push({ validator: Validators.minLength, args: [input.minLength] });
    if (input.maxLength) rules.push({ validator: Validators.maxLength, args: [input.maxLength] });

    return Validators.validate(value, rules);
  },

  // Show error
  showError: (input, message) => {
    input.classList.add('is-invalid');
    let feedback = input.parentNode.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      input.parentNode.appendChild(feedback);
    }
    feedback.textContent = message;
  },

  // Clear error
  clearError: (input) => {
    input.classList.remove('is-invalid');
    const feedback = input.parentNode.querySelector('.invalid-feedback');
    if (feedback) feedback.remove();
  },

  // Clear all errors in form
  clearAll: (formElement) => {
    formElement.querySelectorAll('.is-invalid').forEach(el => {
      el.classList.remove('is-invalid');
      const fb = el.parentNode.querySelector('.invalid-feedback');
      if (fb) fb.remove();
    });
  }
};

// Loading state manager
const LoadingManager = {
  show: (button, text = 'Loading...') => {
    if (!button) return;
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${text}`;
  },

  hide: (button) => {
    if (!button || !button.dataset.originalText) return;
    button.disabled = false;
    button.innerHTML = button.dataset.originalText;
    delete button.dataset.originalText;
  },

  showOverlay: (container, text = 'Loading...') => {
    if (!container) return;
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">${text}</p>
      </div>
    `;
    container.style.position = 'relative';
    container.appendChild(overlay);
    return overlay;
  },

  hideOverlay: (overlay) => {
    if (overlay && overlay.parentNode) {
      overlay.remove();
    }
  }
};

// DOM utilities
const DOMUtils = {
  // Create element with attributes
  create: (tag, attributes = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class') el.className = value;
      else if (key === 'style') el.style.cssText = value;
      else if (key.startsWith('data-')) el.setAttribute(key, value);
      else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child instanceof Node) el.appendChild(child);
    });
    return el;
  },

  // Empty element
  empty: (element) => {
    while (element.firstChild) element.removeChild(element.firstChild);
  },

  // Find closest parent matching selector
  closest: (element, selector) => {
    return element.closest(selector);
  },

  // Toggle class
  toggleClass: (element, className, force) => {
    return element.classList.toggle(className, force);
  }
};

// Date utilities
const DateUtils = {
  format: (date, options = {}) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...options
    });
  },

  formatTime: (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  },

  formatDateTime: (date) => {
    return `${DateUtils.format(date)} ${DateUtils.formatTime(date)}`;
  },

  relative: (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return DateUtils.format(d);
  },

  isToday: (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  },

  startOfDay: (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  endOfDay: (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }
};

// String utilities
const StringUtils = {
  truncate: (str, length = 100, suffix = '...') => {
    return str.length > length ? str.substring(0, length) + suffix : str;
  },

  capitalize: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  slugify: (str) => {
    return str.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  escapeHtml: (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  unescapeHtml: (str) => {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent;
  }
};

// Array utilities
const ArrayUtils = {
  groupBy: (array, key) => {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  },

  sortBy: (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  unique: (array, key) => {
    if (!key) return [...new Set(array)];
    const seen = new Set();
    return array.filter(item => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  },

  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
};

// Export all utilities
window.Validators = Validators;
window.FormValidator = FormValidator;
window.LoadingManager = LoadingManager;
window.DOMUtils = DOMUtils;
window.DateUtils = DateUtils;
window.StringUtils = StringUtils;
window.ArrayUtils = ArrayUtils;

// Module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Validators,
    FormValidator,
    LoadingManager,
    DOMUtils,
    DateUtils,
    StringUtils,
    ArrayUtils
  };
}