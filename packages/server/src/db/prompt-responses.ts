import {
  Delete,
  Op,
  PromptResponseTable,
  Select,
  Update,
  smartClient,
} from "@journal/db";
import { z } from "zod";

export const updatePromptResponseSchema = z.object({
  response: z.string().nullable(),
});

type UpdatePromptResponse = z.infer<typeof updatePromptResponseSchema>;

// See entries.ts's toApiEntry -- created_at needs an explicit ISO-string
// conversion so the inferred client type matches what's actually sent over
// the wire, not the raw pg Date shape.
const toApiPromptResponse = (row: {
  id: string;
  entry_id: string;
  prompt_text: string;
  response: string | null;
  created_at: Date;
}) => ({
  id: row.id,
  entry_id: row.entry_id,
  prompt_text: row.prompt_text,
  response: row.response,
  created_at: row.created_at.toISOString(),
});

export const listPromptResponsesForEntry = async (
  entryId: string,
): Promise<Array<ReturnType<typeof toApiPromptResponse>>> => {
  using client = await smartClient();
  const rows = await Select(...PromptResponseTable.star)
    .from(PromptResponseTable)
    .where(Op.eq(PromptResponseTable.c.entry_id, entryId))
    .orderBy(PromptResponseTable.c.created_at, "asc")
    .many(client);
  return rows.map(toApiPromptResponse);
};

export const updatePromptResponse = async (
  id: string,
  input: UpdatePromptResponse,
): Promise<ReturnType<typeof toApiPromptResponse> | undefined> => {
  using client = await smartClient();
  const row = await Update(PromptResponseTable)
    .set({ response: input.response })
    .where(Op.eq(PromptResponseTable.c.id, id))
    .returning(...PromptResponseTable.star)
    .opt(client);
  return row ? toApiPromptResponse(row) : undefined;
};

export const deletePromptResponse = async (id: string): Promise<void> => {
  using client = await smartClient();
  await Delete(PromptResponseTable)
    .where(Op.eq(PromptResponseTable.c.id, id))
    .execute(client);
};
