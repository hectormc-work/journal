import { Entry, PiquedHead, Prompt, PromptGroup, PromptResponse, Recording, Task } from "./postgres.js";

import { TableBuilder } from "@piqued/client";
export const PiquedHeadTable = new TableBuilder<typeof PiquedHead.spec, PiquedHead.t, "_piqued_head">("_piqued_head", PiquedHead.spec);
export const EntryTable = new TableBuilder<typeof Entry.spec, Entry.t, "entry">("entry", Entry.spec);
export const PromptTable = new TableBuilder<typeof Prompt.spec, Prompt.t, "prompt">("prompt", Prompt.spec);
export const PromptGroupTable = new TableBuilder<typeof PromptGroup.spec, PromptGroup.t, "prompt_group">("prompt_group", PromptGroup.spec);
export const PromptResponseTable = new TableBuilder<typeof PromptResponse.spec, PromptResponse.t, "prompt_response">("prompt_response", PromptResponse.spec);
export const RecordingTable = new TableBuilder<typeof Recording.spec, Recording.t, "recording">("recording", Recording.spec);
export const TaskTable = new TableBuilder<typeof Task.spec, Task.t, "task">("task", Task.spec);
