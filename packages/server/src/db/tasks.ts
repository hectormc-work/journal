import {
  Delete,
  Insert,
  Op,
  Select,
  smartClient,
  TaskTable,
  Update,
} from "@journal/db";
import { DateTime } from "luxon";
import { z } from "zod";

import { toDbDate } from "./entries.js";

export const createTaskSchema = z.object({
  text: z.string().min(1),
});

type CreateTask = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  text: z.string().min(1).optional(),
  done: z.boolean().optional(),
  entry_date: z.iso.date().optional(),
});

type UpdateTask = z.infer<typeof updateTaskSchema>;

// created_at needs an explicit ISO-string conversion so the inferred client
// type matches what's actually sent over the wire, not the raw pg Date shape
// (see entries.ts's toApiEntry for the same pattern). done_date is a date
// column (see piqued-sql.md's date-vs-timestamp rule) -- format as a plain
// YYYY-MM-DD, not a full ISO instant, same treatment as entry.entry_date.
const toApiTask = (row: {
  id: string;
  text: string;
  done_date: Date | null;
  created_at: Date;
}) => ({
  id: row.id,
  text: row.text,
  done_date: row.done_date
    ? DateTime.fromJSDate(row.done_date, { zone: "utc" }).toISODate()
    : null,
  created_at: row.created_at.toISOString(),
});

// Not-done items first (created_at asc, oldest task first); done items below,
// most recently completed first -- the "growing" crossed-off history reads
// newest-on-top.
export const listTasks = async (): Promise<
  Array<ReturnType<typeof toApiTask>>
> => {
  using client = await smartClient();
  const notDone = await Select(...TaskTable.star)
    .from(TaskTable)
    .where(Op.isNull(TaskTable.c.done_date))
    .orderBy(TaskTable.c.created_at, "asc")
    .many(client);
  const done = await Select(...TaskTable.star)
    .from(TaskTable)
    .where(Op.isNotNull(TaskTable.c.done_date))
    .orderBy(TaskTable.c.done_date, "desc")
    .many(client);
  return [...notDone, ...done].map(toApiTask);
};

export const createTask = async (input: CreateTask) => {
  using client = await smartClient();
  const row = await Insert(TaskTable)
    .values({ text: input.text, done_date: null })
    .returning(...TaskTable.star)
    .one(client);
  return toApiTask(row);
};

// done: true with no entry_date means "done today" -- marked from the
// standalone task page/tab, not backdated to some other entry's day.
const today = (): string => DateTime.now().toISODate();

export const updateTask = async (
  id: string,
  input: UpdateTask,
): Promise<ReturnType<typeof toApiTask> | undefined> => {
  using client = await smartClient();
  const row = await Update(TaskTable)
    .set({
      ...(input.text !== undefined ? { text: input.text } : {}),
      ...(input.done !== undefined
        ? {
            done_date: input.done
              ? toDbDate(input.entry_date ?? today())
              : null,
          }
        : {}),
    })
    .where(Op.eq(TaskTable.c.id, id))
    .returning(...TaskTable.star)
    .opt(client);
  return row ? toApiTask(row) : undefined;
};

export const deleteTask = async (id: string): Promise<void> => {
  using client = await smartClient();
  await Delete(TaskTable).where(Op.eq(TaskTable.c.id, id)).execute(client);
};
