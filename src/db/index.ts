import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { config } from "../config/env";

export const poolConnection = config.database.url
  ? mysql.createPool(config.database.url)
  : mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
    });

export const db = drizzle(poolConnection, { schema, mode: "default" });
