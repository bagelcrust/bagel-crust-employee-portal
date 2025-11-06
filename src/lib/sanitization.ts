/**
 * INPUT SANITIZATION UTILITIES
 *
 * Prevents XSS, SQL injection, and other security issues by cleaning user input.
 * ALWAYS sanitize data before:
 * - Displaying in UI
 * - Sending to database
 * - Using in URLs
 *
 * Defense in depth: Sanitize even though Supabase has protections.
 */

/**
 * Escape HTML to prevent XSS attacks
 *
 * Converts special characters to HTML entities.
 * Use when displaying user-provided text in HTML.
 *
 * Example:
 *   const safeText = escapeHtml(userInput);
 *   return <div>{safeText}</div>;
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize name input
 *
 * Allows: letters, spaces, hyphens, apostrophes
 * Use for: first name, last name fields
 */
export function sanitizeName(input: string): string {
  // Remove any characters not allowed in names
  const sanitized = input
    .replace(/[^a-zA-Z\s'-]/g, '')
    .trim()
    .slice(0, 50); // Max 50 characters

  return sanitized;
}

/**
 * Sanitize PIN input
 *
 * Allows: only digits
 * Use for: PIN entry fields
 */
export function sanitizePin(input: string): string {
  // Only keep digits
  return input.replace(/\D/g, '').slice(0, 6); // Max 6 digits
}

/**
 * Sanitize phone number
 *
 * Allows: digits, spaces, parentheses, hyphens, plus
 * Use for: phone number fields
 */
export function sanitizePhoneNumber(input: string): string {
  // Allow common phone formatting characters
  return input
    .replace(/[^0-9\s()\-+]/g, '')
    .slice(0, 20); // Max 20 characters
}

/**
 * Sanitize email
 *
 * Basic email sanitization (browser handles validation)
 * Use for: email fields
 */
export function sanitizeEmail(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .slice(0, 254); // Max email length per RFC 5321
}

/**
 * Sanitize general text input
 *
 * Removes control characters and excessive whitespace
 * Use for: text areas, notes, reason fields
 */
export function sanitizeText(input: string, maxLength: number = 500): string {
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize search query
 *
 * Prevents SQL injection attempts in search
 * Use for: search inputs
 */
export function sanitizeSearchQuery(input: string): string {
  // Remove SQL injection patterns
  const sanitized = input
    .replace(/[';"`]/g, '') // Remove quotes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .replace(/\*\//g, '')
    .trim()
    .slice(0, 100); // Max 100 characters

  return sanitized;
}

/**
 * Sanitize URL parameter
 *
 * Prevents XSS via URL manipulation
 * Use for: building URLs with user input
 */
export function sanitizeUrlParam(input: string): string {
  return encodeURIComponent(input).slice(0, 200);
}

/**
 * Check if string contains suspicious patterns
 *
 * Returns true if input looks like an attack attempt.
 * Use for: additional validation layer
 */
export function containsSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize object recursively
 *
 * Applies sanitization to all string values in an object.
 * Use for: form data before submission
 *
 * Example:
 *   const safeData = sanitizeObject(formData, {
 *     first_name: sanitizeName,
 *     pin: sanitizePin,
 *     email: sanitizeEmail
 *   });
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizers: Partial<Record<keyof T, (val: string) => string>>
): T {
  const result = { ...obj };

  for (const key in sanitizers) {
    const sanitizer = sanitizers[key];
    const value = obj[key];

    if (typeof value === 'string' && sanitizer) {
      result[key] = sanitizer(value) as any;
    }
  }

  return result;
}

/**
 * Rate limit checker (client-side)
 *
 * Prevents spam/abuse by limiting actions per time window.
 * Use for: form submissions, API calls
 *
 * Example:
 *   const rateLimiter = createRateLimiter(5, 60000); // 5 actions per minute
 *   if (!rateLimiter.check()) {
 *     alert('Too many attempts. Please wait.');
 *     return;
 *   }
 */
export function createRateLimiter(maxAttempts: number, windowMs: number) {
  const attempts: number[] = [];

  return {
    check(): boolean {
      const now = Date.now();

      // Remove old attempts outside the window
      while (attempts.length > 0 && attempts[0] < now - windowMs) {
        attempts.shift();
      }

      // Check if under limit
      if (attempts.length >= maxAttempts) {
        return false;
      }

      // Record this attempt
      attempts.push(now);
      return true;
    },

    reset() {
      attempts.length = 0;
    }
  };
}
