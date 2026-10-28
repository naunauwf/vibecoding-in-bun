import { Elysia } from "elysia";
import { poolConnection } from "../db";

export const healthRoutes = new Elysia({ prefix: "/health" })
  .get("/", async () => {
    let dbStatus = "disconnected";
    try {
      await poolConnection.query("SELECT 1");
      dbStatus = "connected";
    } catch (error: any) {
      dbStatus = `disconnected (${error.code || error.message || "database unavailable"})`;
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    };
  });

