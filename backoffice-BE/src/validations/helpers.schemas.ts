import { isValid, parseISO } from "date-fns";
import z from "zod";
import { isString } from "../utils/type-guards.utils.js";

// Helper for date transformation
export const isoDateSchema = z.iso
  .date()
  .transform((v) => (isString(v) ? new Date(v) : v));

// -------------------
// DATE-ONLY SCHEMA
// -------------------
export const DateOnlySchema = z.iso.date().transform((v) => {
  const date = parseISO(v);
  if (!isValid(date)) throw new Error("Invalid calendar date");
  return date;
});

export const IsoDateTimeSchema = z.iso.datetime().transform((v) => {
  const date = parseISO(v);
  if (!isValid(date)) throw new Error("Invalid ISO datetime");
  return date;
});
