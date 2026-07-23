import {
  Delete,
  EntryTable,
  Insert,
  Op,
  Select,
  smartClient,
  Update,
} from "@journal/db";
import { DateTime } from "luxon";
import { z } from "zod";

export const createEntrySchema = z.object({
  entry_date: z.iso.date(),
  name: z.string().optional(),
  body: z.string().nullable().optional(),
});

type CreateEntry = z.infer<typeof createEntrySchema>;

// Full replace (PUT), not partial (PATCH) — all fields always required, no
// per-field optionality to track.
export const updateEntrySchema = z.object({
  entry_date: z.iso.date(),
  name: z.string(),
  body: z.string().nullable(),
});

type UpdateEntry = z.infer<typeof updateEntrySchema>;

// entry_date comes back from pg as a JS Date anchored at UTC midnight for the
// stored calendar date (see PLAN.md's Date/time typing convention) -- treat it
// as UTC, never local time, or display can shift a day in non-UTC timezones.
// No explicit return type here -- let it flow structurally rather than naming
// an "Entry" type that would just duplicate piqued's generated Entry.t.
const toApiEntry = (row: {
  id: string;
  entry_date: Date;
  name: string;
  body: string | null;
  created_at: Date;
}) => ({
  id: row.id,
  entry_date: DateTime.fromJSDate(row.entry_date, { zone: "utc" }).toISODate()!,
  name: row.name,
  body: row.body,
  created_at: row.created_at.toISOString(),
});

const toDbDate = (isoDate: string): Date =>
  DateTime.fromISO(isoDate, { zone: "utc" }).toJSDate();

const defaultName = (isoDate: string): string =>
  DateTime.fromISO(isoDate, { zone: "utc" }).toFormat("MMMM d, yyyy");

// Explicit ReturnType annotations below: Hono's c.json() type inference
// doesn't reliably flow through a .map()'d array or a conditional/branching
// return (undefined | value) the way it does for a single, unconditionally-
// returned inferred object (createEntry doesn't need one) -- derived from
// toApiEntry, not a hand-duplicated shape.
export const getAllEntries = async (): Promise<
  Array<ReturnType<typeof toApiEntry>>
> => {
  using client = await smartClient();
  const rows = await Select(...EntryTable.star)
    .from(EntryTable)
    .orderBy(EntryTable.c.created_at, "desc")
    .many(client);
  return rows.map(toApiEntry);
};

export const createEntry = async (input: CreateEntry) => {
  using client = await smartClient();
  const row = await Insert(EntryTable)
    .values({
      entry_date: toDbDate(input.entry_date),
      name: input.name ?? defaultName(input.entry_date),
      body: input.body ?? null,
    })
    .returning(...EntryTable.star)
    .one(client);
  return toApiEntry(row);
};

export const updateEntry = async (
  id: string,
  input: UpdateEntry,
): Promise<ReturnType<typeof toApiEntry> | undefined> => {
  using client = await smartClient();
  const row = await Update(EntryTable)
    .set({
      entry_date: toDbDate(input.entry_date),
      name: input.name,
      body: input.body,
    })
    .where(Op.eq(EntryTable.c.id, id))
    .returning(...EntryTable.star)
    .opt(client);
  return row ? toApiEntry(row) : undefined;
};

export const deleteEntry = async (id: string): Promise<void> => {
  using client = await smartClient();
  await Delete(EntryTable).where(Op.eq(EntryTable.c.id, id)).execute(client);
};
