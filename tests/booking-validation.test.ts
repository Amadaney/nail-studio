import { describe, it, expect } from "vitest";
import { bookingSchema, usPhone } from "@/lib/validations/booking";

const valid = {
  customerName: "Jane Doe", customerEmail: "Jane@Example.com", customerPhone: "(305) 555-1234",
  professionalId: "7c9e6679-7425-40de-944b-e07fc1f90ae7", serviceIds: ["7c9e6679-7425-40de-944b-e07fc1f90ae7"],
  date: "2030-01-15", startTime: "10:30", consent: true,
};

describe("booking validation", () => {
  it("normalizes US phone numbers", () => {
    expect(usPhone.parse("(305) 555-1234")).toBe("+13055551234");
    expect(usPhone.parse("1-305-555-1234")).toBe("+13055551234");
  });
  it("accepts a valid booking and lowercases email", () => {
    const r = bookingSchema.parse(valid);
    expect(r.customerEmail).toBe("jane@example.com");
  });
  it("rejects HTML in names", () => {
    expect(bookingSchema.safeParse({ ...valid, customerName: "<script>x</script>" }).success).toBe(false);
  });
  it("rejects missing consent and bad time", () => {
    expect(bookingSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, startTime: "25:99" }).success).toBe(false);
  });
});
