/**
 * String utility helpers for the ConUMap application
 */

/**
 * Capitalizes the first letter of each word in a string
 * @param str The string to capitalize
 * @returns The capitalized string
 */
export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Removes extra whitespace from a string
 * @param str The string to clean
 * @returns The cleaned string
 */
export function trimWhitespace(str: string): string {
  if (!str) return "";
  return str.trim().replace(/\s+/g, " ");
}

/**
 * Truncates a string to a maximum length and adds ellipsis if needed
 * @param str The string to truncate
 * @param maxLength The maximum length (including ellipsis)
 * @returns The truncated string
 */
export function truncateString(str: string, maxLength: number = 50): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}
