// Security configuration and utilities for Hakum Auto Care

// Security constants
export const SECURITY_CONFIG = {
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  
  // Input validation limits
  MAX_PLATE_LENGTH: 8,
  MAX_MODEL_LENGTH: 100,
  MAX_PHONE_LENGTH: 15,
  MAX_SERVICE_NAME_LENGTH: 200,
  MAX_COST: 100000,
  
  // Session management
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  
  // API limits
  MAX_SEARCH_RESULTS: 100,
  MAX_BATCH_OPERATIONS: 50,
  
  // File upload limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
} as const;

// Content Security Policy headers (for production)
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

// Security headers for production
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  ...CSP_HEADERS
};

// Input sanitization patterns
export const SANITIZATION_PATTERNS = {
  // Remove potentially dangerous HTML/JS
  HTML_TAGS: /<[^>]*>/g,
  SCRIPT_TAGS: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  EVENT_HANDLERS: /on\w+\s*=\s*["'][^"']*["']/gi,
  JAVASCRIPT_PROTOCOL: /javascript:/gi,
  DATA_PROTOCOL: /data:text\/html/gi,
  
  // SQL injection patterns (basic)
  SQL_COMMENTS: /--/g,
  SQL_UNION: /union\s+select/gi,
  SQL_DROP: /drop\s+table/gi,
  SQL_DELETE: /delete\s+from/gi,
} as const;

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(SANITIZATION_PATTERNS.HTML_TAGS, '')
    .replace(SANITIZATION_PATTERNS.SCRIPT_TAGS, '')
    .replace(SANITIZATION_PATTERNS.EVENT_HANDLERS, '')
    .replace(SANITIZATION_PATTERNS.JAVASCRIPT_PROTOCOL, '')
    .replace(SANITIZATION_PATTERNS.DATA_PROTOCOL, '')
    .replace(SANITIZATION_PATTERNS.SQL_COMMENTS, '')
    .replace(SANITIZATION_PATTERNS.SQL_UNION, '')
    .replace(SANITIZATION_PATTERNS.SQL_DROP, '')
    .replace(SANITIZATION_PATTERNS.SQL_DELETE, '');
};

// Validate and sanitize license plate
export const sanitizeLicensePlate = (plate: string): string => {
  if (!plate) return '';
  
  const sanitized = plate
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '') // Only allow letters, numbers, and hyphens
    .substring(0, SECURITY_CONFIG.MAX_PLATE_LENGTH);
    
  return sanitized;
};

// Validate and sanitize phone number
export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  return phone
    .trim()
    .replace(/[^\d+]/g, '') // Only allow digits and plus sign
    .substring(0, SECURITY_CONFIG.MAX_PHONE_LENGTH);
};

// Validate and sanitize car model
export const sanitizeCarModel = (model: string): string => {
  if (!model) return '';
  
  return sanitizeInput(model)
    .substring(0, SECURITY_CONFIG.MAX_MODEL_LENGTH);
};

// Validate cost
export const validateCost = (cost: number): boolean => {
  return typeof cost === 'number' && 
         !isNaN(cost) && 
         cost >= 0 && 
         cost <= SECURITY_CONFIG.MAX_COST;
};

// Generate secure random ID (for client-side use)
export const generateSecureId = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Check if running in development mode
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || process.env.NODE_ENV === 'development';
};

// Check if running in production mode
export const isProduction = (): boolean => {
  return import.meta.env.PROD || process.env.NODE_ENV === 'production';
};

// Log security events (in production, this would go to a security monitoring service)
export const logSecurityEvent = (event: string, details?: any): void => {
  if (isProduction()) {
    console.warn(`[SECURITY] ${event}`, details);
    // In production, send to security monitoring service
    // Example: sendToSecurityService(event, details);
  } else {
    console.log(`[SECURITY] ${event}`, details);
  }
};

// Validate UUID format
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Prevent XSS in dynamic content
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Validate file upload
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size too large' };
  }

  if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }

  return { isValid: true };
}; 