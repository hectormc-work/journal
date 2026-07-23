import { z } from "zod";

const settingsSchema = z.object({
  server: z.object({
    port: z.coerce.number().int().default(3000),
  }),
  db: z.object({
    host: z.string().default("localhost"),
    port: z.coerce.number().int().default(5432),
    user: z.string().default("journal"),
    password: z.string().default("journal"),
    database: z.string().default("journal"),
  }),
});

export type Settings = z.infer<typeof settingsSchema>;

// Empty-string env vars should fall through to the default, same as unset ones.
const emptyToUndefined = (value: string | undefined) =>
  value ? value : undefined;

export const settings: Settings = settingsSchema.parse({
  server: {
    port: emptyToUndefined(process.env.PORT),
  },
  db: {
    host: emptyToUndefined(process.env.DB_HOST),
    port: emptyToUndefined(process.env.DB_PORT),
    user: emptyToUndefined(process.env.DB_USER),
    password: emptyToUndefined(process.env.DB_PASSWORD),
    database: emptyToUndefined(process.env.DB_NAME),
  },
});
