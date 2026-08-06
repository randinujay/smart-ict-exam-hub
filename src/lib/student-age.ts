// O/L students are typically ~14-16, A/L ~16-19, but the class also takes early
// starters and repeat/older students, so the bounds are deliberately generous
// rather than tightly tied to a single exam year. Used by both the register form
// (as <input min/max>) and the server action (which must not trust the client).
export const MIN_STUDENT_AGE = 8;
export const MAX_STUDENT_AGE = 25;

function isoDateYearsAgo(years: number, from = new Date()) {
  const date = new Date(from);
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().slice(0, 10);
}

export function dateOfBirthBounds(now = new Date()) {
  return {
    min: isoDateYearsAgo(MAX_STUDENT_AGE, now),
    max: isoDateYearsAgo(MIN_STUDENT_AGE, now),
  };
}

export function isValidDateOfBirth(value: string, now = new Date()) {
  if (!value) return false;
  const parsed = new Date(`${value}T00:00:00+05:30`);
  if (Number.isNaN(parsed.getTime())) return false;
  const { min, max } = dateOfBirthBounds(now);
  return value >= min && value <= max;
}
