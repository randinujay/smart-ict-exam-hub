// Supabase Auth rejects reserved local-only domains such as `.local`.
// This alias is never used for email delivery; it maps a phone login to Auth.
const DEFAULT_DOMAIN = "students.smartict.lk";

export function normalizeSriLankanPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("94") && digits.length === 11) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `94${digits.slice(1)}`;
  if (digits.length === 9) return `94${digits}`;
  return digits;
}

export function displayPhone(value: string) {
  const normalized = normalizeSriLankanPhone(value);
  if (normalized.startsWith("94") && normalized.length === 11) {
    return `0${normalized.slice(2, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
  }
  return value;
}

export function studentEmailAlias(phone: string) {
  const normalized = normalizeSriLankanPhone(phone);
  const configuredDomain = process.env.STUDENT_EMAIL_DOMAIN?.trim().toLowerCase();
  const domain = configuredDomain && !configuredDomain.endsWith(".local") ? configuredDomain : DEFAULT_DOMAIN;
  return `${normalized}@${domain}`;
}

export function isValidSriLankanMobile(phone: string) {
  return /^94(7[0-8])\d{7}$/.test(normalizeSriLankanPhone(phone));
}

// Local (0-prefixed) equivalent of the check above, for client-side <input pattern>
// and JS validation. Both the login and register forms must use this single source
// so a number accepted at registration is never rejected at login (or vice versa).
export const LOCAL_MOBILE_PATTERN = "0[7][0-8][0-9]{7}";
export const LOCAL_MOBILE_REGEX = new RegExp(`^${LOCAL_MOBILE_PATTERN}$`);

// Cleans a phone number as the user types: strips spaces/dashes/parens and folds
// a +94 / 94 country-code prefix down to the local 0-prefixed display format, using
// the same thresholds as normalizeSriLankanPhone so client display and server
// storage can never disagree about what a given input means.
export function sanitizePhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("94") && digits.length === 11) return `0${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length <= 10) return digits;
  if (digits.length === 9 && !digits.startsWith("0")) return `0${digits}`;
  return digits.length > 10 ? digits.slice(0, 10) : digits;
}
