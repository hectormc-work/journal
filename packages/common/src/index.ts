// Intentionally empty for now. Validation schemas belong to the server (only
// it validates untrusted input — @hono/zod-validator, colocated with the
// route that uses them); output shapes come for free via structural
// inference (server) and hono/client's InferResponseType (client) off the
// AppType chain. This package is for things genuinely shared as hand-written
// code — constants, enums, etc. — once something actually needs that.
export {};
