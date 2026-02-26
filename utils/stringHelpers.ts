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
 * Converts a string to title case (capitalized words separated by spaces)
 * @param str The string to convert
 * @returns The title case string
 */
export function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : ""))
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
 * Reverses a string
 * @param str The string to reverse
 * @returns The reversed string
 */
export function reverseString(str: string): string {
  if (!str) return "";
  return str.split("").reverse().join("");
}

/**
 * Checks if a string is a palindrome (ignoring spaces and case)
 * @param str The string to check
 * @returns True if the string is a palindrome, false otherwise
 */
export function isPalindrome(str: string): boolean {
  if (!str) return false;
  const cleaned = str.toLowerCase().replace(/\s+/g, "");
  return cleaned === reverseString(cleaned);
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

/**
 * Counts the number of words in a string
 * @param str The string to count
 * @returns The number of words
 */
export function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Joins an array of strings with proper grammar (serial comma)
 * @param items Array of strings to join
 * @param separator The separator to use (default: "and")
 * @returns The joined string
 */
export function joinWithGrammar(items: string[], separator: string = "and"): string {
  if (!items || items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${separator} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${separator} ${items[items.length - 1]}`;
}
