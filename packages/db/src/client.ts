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
