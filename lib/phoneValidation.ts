/**
 * Phone validation with real country code prefixes + exactly 9 local digits.
 * Format: +{country_code}{9 digits}
 */

const COUNTRY_CODES = [
  // 1-digit
  '1',     // US, Canada
  '7',     // Russia, Kazakhstan
  // 2-digit
  '20',    // Egypt
  '27',    // South Africa
  '30',    // Greece
  '31',    // Netherlands
  '32',    // Belgium
  '33',    // France
  '34',    // Spain
  '36',    // Hungary
  '39',    // Italy
  '40',    // Romania
  '41',    // Switzerland
  '43',    // Austria
  '44',    // UK
  '45',    // Denmark
  '46',    // Sweden
  '47',    // Norway
  '48',    // Poland
  '49',    // Germany
  '51',    // Peru
  '52',    // Mexico
  '54',    // Argentina
  '55',    // Brazil
  '56',    // Chile
  '57',    // Colombia
  '58',    // Venezuela
  '60',    // Malaysia
  '61',    // Australia
  '62',    // Indonesia
  '63',    // Philippines
  '64',    // New Zealand
  '65',    // Singapore
  '66',    // Thailand
  '81',    // Japan
  '82',    // South Korea
  '84',    // Vietnam
  '86',    // China
  '90',    // Turkey
  '91',    // India
  '92',    // Pakistan
  '93',    // Afghanistan
  '94',    // Sri Lanka
  '95',    // Myanmar
  // 3-digit
  '212',   // Morocco
  '213',   // Algeria
  '216',   // Tunisia
  '234',   // Nigeria
  '254',   // Kenya
  '351',   // Portugal
  '352',   // Luxembourg
  '353',   // Ireland
  '354',   // Iceland
  '355',   // Albania
  '356',   // Malta
  '357',   // Cyprus
  '358',   // Finland
  '359',   // Bulgaria
  '370',   // Lithuania
  '371',   // Latvia
  '372',   // Estonia
  '373',   // Moldova
  '374',   // Armenia
  '375',   // Belarus
  '376',   // Andorra
  '377',   // Monaco
  '378',   // San Marino
  '380',   // Ukraine
  '381',   // Serbia
  '382',   // Montenegro
  '383',   // Kosovo
  '385',   // Croatia
  '386',   // Slovenia
  '387',   // Bosnia
  '389',   // North Macedonia
  '420',   // Czech Republic
  '421',   // Slovakia
  '423',   // Liechtenstein
  '852',   // Hong Kong
  '886',   // Taiwan
  '961',   // Lebanon
  '962',   // Jordan
  '964',   // Iraq
  '965',   // Kuwait
  '966',   // Saudi Arabia
  '968',   // Oman
  '971',   // UAE
  '972',   // Israel
  '973',   // Bahrain
  '974',   // Qatar
  '995',   // Georgia
];

/**
 * Find matching country code from the beginning of a digit string.
 * Tries longest match first (3 → 2 → 1 digit).
 */
function findCountryCode(digits: string): string | null {
  for (const len of [3, 2, 1]) {
    if (digits.length >= len) {
      const candidate = digits.substring(0, len);
      if (COUNTRY_CODES.includes(candidate)) return candidate;
    }
  }
  return null;
}

/**
 * Sanitize phone input during typing.
 * - Only allows +, digits, spaces
 * - + only at the beginning
 * - Once a valid country code is detected, limits to code + 9 local digits
 * - Without a detected code, allows max 12 digits (3-digit code + 9)
 */
export function sanitizePhoneInput(value: string): string {
  // Strip everything except +, digits, spaces
  let result = value.replace(/[^\d+\s]/g, '');

  // Ensure + only at the start
  const hasPlus = result.startsWith('+');
  result = result.replace(/\+/g, '');
  if (hasPlus) result = '+' + result;

  // Get just the digits
  const digits = result.replace(/\D/g, '');

  // Detect country code to determine max digit count
  const matchedCode = findCountryCode(digits);
  const maxDigits = matchedCode ? matchedCode.length + 9 : 12;

  if (digits.length > maxDigits) {
    let output = hasPlus ? '+' : '';
    let digitCount = 0;
    for (const ch of (hasPlus ? result.slice(1) : result)) {
      if (/\d/.test(ch)) {
        if (digitCount >= maxDigits) break;
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

/**
 * Validate a completed phone number.
 * Returns error message (Czech) or null if valid.
 */
export function validatePhone(value: string): string | null {
  if (!value || !value.trim()) return null; // empty is ok (field may be optional)

  const digits = value.replace(/\D/g, '');

  if (!value.startsWith('+')) {
    return 'Telefonní číslo musí začínat předvolbou (např. +420)';
  }

  const code = findCountryCode(digits);
  if (!code) {
    return 'Neplatná mezinárodní předvolba';
  }

  const localDigits = digits.substring(code.length);
  if (localDigits.length < 9) {
    return 'Telefonní číslo musí mít 9 číslic za předvolbou';
  }
  if (localDigits.length > 9) {
    return 'Telefonní číslo má příliš mnoho číslic';
  }

  return null;
}
