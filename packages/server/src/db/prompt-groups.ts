import {
  Delete,
  Insert,
  Op,
  PromptGroupTable,
  PromptTable,
  Select,
  smartClient,
} from "@journal/db";
import { z } from "zod";

export const createPromptGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

type CreatePromptGroup = z.infer<typeof createPromptGroupSchema>;

export const listPromptGroups = async (): Promise<
  Array<{ id: string; name: string; description: string | null }>
> => {
  using client = await smartClient();
  return Select(...PromptGroupTable.star)
    .from(PromptGroupTable)
    .many(client);
};

export const createPromptGroup = async (input: CreatePromptGroup) => {
  using client = await smartClient();
  return Insert(PromptGroupTable)
    .values({ name: input.name, description: input.description ?? null })
    .returning(...PromptGroupTable.star)
    .one(client);
};

// Deletes the group's prompts first -- prompt.group_id has no ON DELETE
// CASCADE, and prompt_response never references prompt/prompt_group at all
// (see PLAN.md's snapshot-not-reference decision), so this is safe to do
// unconditionally rather than requiring the group to be emptied first.
export const deletePromptGroup = async (id: string): Promise<void> => {
  using client = await smartClient();
  await Delete(PromptTable)
    .where(Op.eq(PromptTable.c.group_id, id))
    .execute(client);
  await Delete(PromptGroupTable)
    .where(Op.eq(PromptGroupTable.c.id, id))
    .execute(client);
};
