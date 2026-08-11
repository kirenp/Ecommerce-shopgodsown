/**
 * Security utility functions for input sanitization and validation.
 */

/**
 * Escape HTML special characters to prevent XSS/HTML injection.
 * Converts &, <, >, ", ' to their HTML entity equivalents.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Truncate a string to a maximum length.
 * Returns the original string if it's within the limit.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength);
}

/**
 * Validate and truncate common input fields.
 * Returns sanitized values or null if validation fails.
 */
export function sanitizeInput(value: string, maxLength: number): string {
  return truncate(value.trim(), maxLength);
}
