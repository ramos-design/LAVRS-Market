/**
 * Sanitize phone input – only allows +, digits, and spaces.
 * The + sign is only allowed at the very beginning.
 * Limits total digit count to 12 (e.g. +420 = 3 digits country code + 9 digits).
 */
export function sanitizePhoneInput(value: string): string {
  // Strip everything except +, digits, spaces
  let result = value.replace(/[^\d+\s]/g, '');

  // Ensure + only at the start
  const hasPlus = result.startsWith('+');
  result = result.replace(/\+/g, '');
  if (hasPlus) result = '+' + result;

  // Count digits and trim if over 12
  const digits = result.replace(/\D/g, '');
  if (digits.length > 12) {
    let output = hasPlus ? '+' : '';
    let digitCount = 0;
    for (const ch of (hasPlus ? result.slice(1) : result)) {
      if (/\d/.test(ch)) {
        if (digitCount >= 12) break;
        output += ch;
        digitCount++;
      } else {
        output += ch;
      }
    }
    return output;
  }

  return result;
}
