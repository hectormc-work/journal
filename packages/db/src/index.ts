export { smartClient, upgrade } from "./client.js";
export {
  EntryTable,
  PromptGroupTable,
  PromptResponseTable,
  PromptTable,
  RecordingTable,
  TaskTable,
} from "./tables.js";

// Query-builder primitives, re-exported so packages/server only ever needs to
// depend on @journal/db, not reach past it to @piqued/client directly.
export { Delete, Insert, Op, Select, Update } from "@piqued/client";
