// Checks for the website forms. They give the visitor a clear message next to the field before anything is sent,
// and send cleaned values. The server repeats every check, so these rules must stay in step with
// backend/app/schemas/website.py and backend/app/utils/phone.py.

export const CONSENT_ERROR = "Please confirm this to send your request.";

// Single-line text: no stray line breaks, one space between words, nothing at the ends.
export const cleanLine = (value: string) => value.replace(/\s+/g, " ").trim();

// Several lines: tidy spacing, but keep the visitor's paragraphs.
export const cleanText = (value: string) =>
  value
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M} '.-]*$/u;
const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export function validateName(raw: string): string | null {
  const value = cleanLine(raw);
  if (!value) return "Enter your name.";
  if (value.length < 2) return "Your name is too short.";
  if (value.length > 160) return "Your name is too long (160 characters at most).";
  if (!PERSON_NAME.test(value)) return "Use letters only in your name, for example Amina Joseph.";
  return null;
}

// The company is optional: left empty it is fine, but if something is written it must look like a real name.
export function validateCompany(raw: string): string | null {
  const value = cleanLine(raw);
  if (!value) return null;
  if (value.length < 2) return "This is too short. Enter your company name, or leave it empty.";
  if (value.length > 160) return "This is too long (160 characters at most).";
  if (!HAS_LETTER_OR_DIGIT.test(value) || /[<>]/.test(value))
    return "Enter your company name, or leave it empty.";
  return null;
}

export function validateEmail(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Enter your email address.";
  if (value.length > 255) return "This email address is too long.";
  if (!EMAIL.test(value)) return "Enter a valid email address, for example name@example.com.";
  return null;
}

// Same rules as the server: a Tanzanian mobile number (06x or 07x), with or without +255 or spaces.
export function normalizeTzPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("255") && digits.length === 12 && "67".includes(digits.charAt(3)))
    return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10 && "67".includes(digits.charAt(1)))
    return `+255${digits.slice(1)}`;
  if (digits.length === 9 && "67".includes(digits.charAt(0))) return `+255${digits}`;
  return null;
}

export function validatePhone(raw: string): string | null {
  if (!raw.trim()) return "Enter your mobile number.";
  if (/[^\d\s+()-]/.test(raw)) return "Use digits only, for example 0712 345 678.";
  if (!normalizeTzPhone(raw))
    return "Enter a valid Tanzanian mobile number, for example 0712 345 678.";
  return null;
}

export function validateMessage(raw: string): string | null {
  const value = cleanText(raw);
  if (!value) return "Write your message.";
  if (value.length < 5) return "Your message is too short. Tell us a little more.";
  if (value.length > 2000) return "Your message is too long (2000 characters at most).";
  if (CONTROL_CHARS.test(value)) return "Your message has characters we cannot accept.";
  if (!HAS_LETTER_OR_DIGIT.test(value)) return "Write your message in words.";
  return null;
}

export function validateQuantity(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Enter how many you want.";
  if (!/^\d+$/.test(value)) return "Enter a whole number, for example 2.";
  const quantity = Number(value);
  if (quantity < 1) return "The quantity must be at least 1.";
  if (quantity > 500) return "For more than 500, please call us.";
  return null;
}

export function validateOptionalText(raw: string, max: number, label: string): string | null {
  const value = cleanText(raw);
  if (value.length > max) return `${label} is too long (${max} characters at most).`;
  if (CONTROL_CHARS.test(value)) return `${label} has characters we cannot accept.`;
  return null;
}

// Moves the visitor to the first field that needs fixing, so they see the message instead of wondering why nothing happened.
export function focusFirstError(form: HTMLFormElement | null) {
  const bad = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
  bad?.focus();
  bad?.scrollIntoView({ block: "center", behavior: "smooth" });
}
