import {
  Delete,
  Insert,
  Op,
  PromptTable,
  Select,
  smartClient,
} from "@journal/db";
import { z } from "zod";

export const createPromptSchema = z.object({
  group_id: z.uuid(),
  text: z.string().min(1),
});

type CreatePrompt = z.infer<typeof createPromptSchema>;

// See entries.ts's toApiEntry -- created_at needs an explicit ISO-string
// conversion so the inferred client type matches what's actually sent over
// the wire, not the raw pg Date shape.
const toApiPrompt = (row: {
  id: string;
  group_id: string;
  position: number;
  text: string;
  archived: boolean;
  created_at: Date;
}) => ({
  id: row.id,
  group_id: row.group_id,
  position: row.position,
  text: row.text,
  archived: row.archived,
  created_at: row.created_at.toISOString(),
});

// Unfiltered -- the client groups prompts by group_id itself. Dataset is
// small enough (a personal prompt bank) that a per-group fetch isn't
// worth the extra round trips.
export const listPrompts = async (): Promise<
  Array<ReturnType<typeof toApiPrompt>>
> => {
  using client = await smartClient();
  const rows = await Select(...PromptTable.star)
    .from(PromptTable)
    .many(client);
  return rows.map(toApiPrompt);
};

export const createPrompt = async (input: CreatePrompt) => {
  using client = await smartClient();
  const existing = await Select(PromptTable.c.position)
    .from(PromptTable)
    .where(Op.eq(PromptTable.c.group_id, input.group_id))
    .many(client);
  const nextPosition = Math.max(0, ...existing.map((row) => row.position)) + 1;

  const row = await Insert(PromptTable)
    .values({
      group_id: input.group_id,
      text: input.text,
      position: nextPosition,
    })
    .returning(...PromptTable.star)
    .one(client);
  return toApiPrompt(row);
};

export const deletePrompt = async (id: string): Promise<void> => {
  using client = await smartClient();
  await Delete(PromptTable).where(Op.eq(PromptTable.c.id, id)).execute(client);
};
