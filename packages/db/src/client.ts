// pg's `date` (de)serialization uses the Node process's *local* time (both
// directions -- see packages/db/CLAUDE.md's Date/time section for the
// specifics), not UTC. Forcing the process to run in UTC makes "local" and
// "UTC" the same thing, so treating every DB date as UTC (Luxon, elsewhere in
// this codebase) is actually correct instead of a locale-dependent bug. Must
// be set before anything touches a Date.
process.env.TZ = "UTC";

import { settings } from "@journal/common/node";
import {
  buildColumnOrderCache,
  PiquedUpgradeControl,
  SmartClient,
} from "@piqued/client";
import pg from "pg";

import * as tables from "./postgres.js";

const pool = new pg.Pool({
  host: settings.db.host,
  port: settings.db.port,
  user: settings.db.user,
  password: settings.db.password,
  database: settings.db.database,
});

await buildColumnOrderCache(tables, pool);

export const smartClient = async (): Promise<SmartClient> => {
  const client = await pool.connect();
  return new SmartClient(client);
};

const upgradesDir = new URL("../upgrades", import.meta.url).pathname;

export const upgrade = async (
  version?: string,
  options: { allowDowngrade?: boolean } = {},
) => {
  using client = await smartClient();
  const upgradeControl = await PiquedUpgradeControl.fromDir(upgradesDir);
  await upgradeControl.upgradeToVersion(client, version, {
    preventDowngrade: !options.allowDowngrade,
  });
};
