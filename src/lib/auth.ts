const DEFAULT_DOMAIN = "students.smartict.local";

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
  const domain = process.env.STUDENT_EMAIL_DOMAIN || DEFAULT_DOMAIN;
  return `${normalized}@${domain}`;
}

export function isValidSriLankanMobile(phone: string) {
  return /^94(7[0-8])\d{7}$/.test(normalizeSriLankanPhone(phone));
}
