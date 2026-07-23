import { hc } from "hono/client";
import type { InferRequestType, InferResponseType } from "hono/client";

import type { AppType } from "@journal/server";

// Raw typed RPC client — routes, params, and response bodies all come from
// the server's inferred AppType (type-only import, so no server code is
// bundled). `api` below wraps it into a friendlier surface — components call
// api.entry.create(...) etc. instead of touching this directly.
const client = hc<AppType>("/").api;

export type Entry = InferResponseType<typeof client.entries.$get>[number];

type CreateEntryBody = InferRequestType<typeof client.entries.$post>["json"];

const entryById = client.entries[":id"];
type UpdateEntryBody = InferRequestType<typeof entryById.$put>["json"];

const entryPromptGroups = entryById["prompt-groups"];
type AddPromptGroupBody = InferRequestType<
  typeof entryPromptGroups.$post
>["json"];

const entryPromptResponses = entryById["prompt-responses"];
type CreatePromptResponseBody = InferRequestType<
  typeof entryPromptResponses.$post
>["json"];

export type PromptGroup = InferResponseType<
  (typeof client)["prompt-groups"]["$get"]
>[number];
type CreatePromptGroupBody = InferRequestType<
  (typeof client)["prompt-groups"]["$post"]
>["json"];
const promptGroupById = client["prompt-groups"][":id"];

export type Prompt = InferResponseType<typeof client.prompts.$get>[number];
type CreatePromptBody = InferRequestType<typeof client.prompts.$post>["json"];
const promptById = client.prompts[":id"];

export type PromptResponse = InferResponseType<
  typeof entryPromptResponses.$get
>[number];
const promptResponseById = client["prompt-responses"][":id"];
type UpdatePromptResponseBody = InferRequestType<
  typeof promptResponseById.$patch
>["json"];

export type Task = InferResponseType<typeof client.tasks.$get>[number];
type CreateTaskBody = InferRequestType<typeof client.tasks.$post>["json"];
const taskById = client.tasks[":id"];
type UpdateTaskBody = InferRequestType<typeof taskById.$patch>["json"];

export const api = {
  entry: {
    list: async (): Promise<Entry[]> => {
      const res = await client.entries.$get();
      return res.json();
    },

    create: async (body: CreateEntryBody): Promise<Entry> => {
      const res = await client.entries.$post({ json: body });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    update: async (id: string, body: UpdateEntryBody): Promise<Entry> => {
      const res = await entryById.$put({ param: { id }, json: body });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    remove: async (id: string): Promise<void> => {
      const res = await entryById.$delete({ param: { id } });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
    },

    addPromptGroup: async (
      id: string,
      body: AddPromptGroupBody,
    ): Promise<PromptResponse[]> => {
      const res = await entryPromptGroups.$post({ param: { id }, json: body });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    // Not a typed RPC call -- just the download URL for a plain <a href>,
    // the browser handles the save via the server's Content-Disposition header.
    exportUrl: (id: string): string => `/api/entries/${id}/export`,
  },

  promptGroup: {
    list: async (): Promise<PromptGroup[]> => {
      const res = await client["prompt-groups"].$get();
      return res.json();
    },

    create: async (body: CreatePromptGroupBody): Promise<PromptGroup> => {
      const res = await client["prompt-groups"].$post({ json: body });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    remove: async (id: string): Promise<void> => {
      const res = await promptGroupById.$delete({ param: { id } });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
    },
  },

  prompt: {
    list: async (): Promise<Prompt[]> => {
      const res = await client.prompts.$get();
      return res.json();
    },

    create: async (body: CreatePromptBody): Promise<Prompt> => {
      const res = await client.prompts.$post({ json: body });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    remove: async (id: string): Promise<void> => {
      const res = await promptById.$delete({ param: { id } });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
    },
  },

  promptResponse: {
    listForEntry: async (entryId: string): Promise<PromptResponse[]> => {
      const res = await entryPromptResponses.$get({ param: { id: entryId } });
      return res.json();
    },

    // A one-off prompt typed directly onto an entry -- POST /entries/:id/prompt-responses.
    create: async (
      entryId: string,
      body: CreatePromptResponseBody,
    ): Promise<PromptResponse> => {
      const res = await entryPromptResponses.$post({
        param: { id: entryId },
        json: body,
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    update: async (
      id: string,
      body: UpdatePromptResponseBody,
    ): Promise<PromptResponse> => {
      const res = await promptResponseById.$patch({
        param: { id },
        json: body,
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    remove: async (id: string): Promise<void> => {
      const res = await promptResponseById.$delete({ param: { id } });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
    },
  },

  task: {
    list: async (): Promise<Task[]> => {
      const res = await client.tasks.$get();
      return res.json();
    },

    create: async (body: CreateTaskBody): Promise<Task> => {
      const res = await client.tasks.$post({ json: body });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    update: async (id: string, body: UpdateTaskBody): Promise<Task> => {
      const res = await taskById.$patch({ param: { id }, json: body });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    remove: async (id: string): Promise<void> => {
      const res = await taskById.$delete({ param: { id } });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
    },
  },
};
