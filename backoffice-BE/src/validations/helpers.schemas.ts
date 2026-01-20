import { isValid, parseISO } from "date-fns";
import z from "zod";

// Helper for date transformation
export const isoDateSchema = z.iso
  .date()
  .transform((v) => (typeof v === "string" ? new Date(v) : v));

// -------------------
// DATE-ONLY SCHEMA
// -------------------
export const DateOnlySchema = z.iso.date().transform((v) => {
  const date = parseISO(v);
  if (!isValid(date)) throw new Error("Invalid calendar date");
  return date;
});
