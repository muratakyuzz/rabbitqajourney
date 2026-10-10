import { z } from "zod";

// ADR-0007 K3 (D7 = b): mock ids are not uuids (`p_…`), so ids are non-empty strings;
// dates are `YYYY-MM-DD`, timestamps ISO 8601 with `Z`.
export const IdSchema = z.string().min(1);
export const IsoDateSchema = z.iso.date();
export const IsoDateTimeSchema = z.iso.datetime();

/** A required text field: trimmed, and blank (or whitespace only) is a 400 with this message. */
export const requiredText = (message: string) => z.string().trim().min(1, message);
