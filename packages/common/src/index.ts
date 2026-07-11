import { z } from "zod";

// First shared schema — proves the common → server → client type chain.
// Real journal schemas (entries, questions, etc.) land here in Phase 2.
export const healthSchema = z.object({
  status: z.literal("ok"),
  time: z.string(),
});

export type Health = z.infer<typeof healthSchema>;
