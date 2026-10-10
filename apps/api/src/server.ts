import { randomUUID } from "node:crypto";
import { createApp } from "./app";
import { createDb } from "./db";

// Faz 1 has no login (docs/PLAN.md), so the API listens on loopback only unless API_HOST says otherwise.
const host = process.env.API_HOST || "127.0.0.1";
const port = Number(process.env.API_PORT ?? 3001);
const db = await createDb();
const app = createApp({ db, bootId: randomUUID(), startedAt: new Date().toISOString() });

// Express 5 hands listen errors (e.g. EADDRINUSE) to the callback instead of throwing.
app.listen(port, host, (err?: Error) => {
  if (err) {
    console.error(`API could not listen on ${host}:${port}: ${err.message}`);
    process.exit(1);
  }
  const shown = host.includes(":") ? `[${host}]` : host;
  console.log(`API: http://${shown}:${port}/api (pg-mem, seed loaded)`);
});
