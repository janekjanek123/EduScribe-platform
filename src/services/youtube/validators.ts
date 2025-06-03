/**
 * Validators for YouTube-related functionality
 */

/**
 * Checks if a string is likely a URL
 * @param url The string to check
 * @returns boolean indicating if the string is a valid URL
 */
export function isLikelyUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
} 