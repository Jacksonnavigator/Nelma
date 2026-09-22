import { describe, expect, it } from "vitest";
import { hasErrors, validateLogin, validateRegistration, validateResetPassword } from "../utils/validation";

const validRegistration = {
  fullName: "Asha Mrema",
  phone: "+255 700 000 000",
  email: "asha@example.com",
  password: "StrongPass1",
  confirmPassword: "StrongPass1",
  preferredLanguage: "en" as const,
  addressLocationPreference: "single" as const
};

describe("authentication validation", () => {
  it("accepts a valid registration", () => {
    const errors = validateRegistration(validRegistration);
    expect(hasErrors(errors)).toBe(false);
  });

  it("requires signup language and location choices", () => {
    const errors = validateRegistration({
      ...validRegistration,
      preferredLanguage: undefined,
      addressLocationPreference: undefined
    });
    expect(errors.preferredLanguage).toBeTruthy();
    expect(errors.addressLocationPreference).toBeTruthy();
  });

  it("rejects mismatched registration passwords", () => {
    const errors = validateRegistration({
      ...validRegistration,
      confirmPassword: "Different1"
    });
    expect(errors.confirmPassword).toBeTruthy();
  });

  it("validates login identifiers", () => {
    expect(hasErrors(validateLogin({ identifier: "asha@example.com", password: "StrongPass1" }))).toBe(false);
    expect(validateLogin({ identifier: "bad", password: "short" }).identifier).toBeTruthy();
  });

  it("requires reset verification and matching passwords", () => {
    const errors = validateResetPassword({
      identifier: "asha@example.com",
      resetToken: "",
      newPassword: "StrongPass1",
      confirmPassword: "StrongPass2"
    });
    expect(errors.resetToken).toBeTruthy();
    expect(errors.confirmPassword).toBeTruthy();
  });
});


describe("API-compatible authentication inputs", () => {
  it("allows optional email but rejects malformed nonblank email", () => {
    expect(hasErrors(validateRegistration({ ...validRegistration, email: "   " }))).toBe(false);
    expect(validateRegistration({ ...validRegistration, email: "not-an-email" }).email).toBeTruthy();
  });
  it("accepts backend phone formats and rejects non-Tanzanian phones", () => {
    for (const identifier of ["0712345678", "712345678", "+255 (712) 345-678", "00255712345678"]) {
      expect(hasErrors(validateLogin({ identifier, password: "StrongPass1" }))).toBe(false);
    }
    expect(validateLogin({ identifier: "+254712345678", password: "StrongPass1" }).identifier).toBeTruthy();
  });
  it("rejects passwords exceeding the backend limit", () => {
    expect(validateLogin({ identifier: "0712345678", password: "x".repeat(129) }).password).toBeTruthy();
  });
});
