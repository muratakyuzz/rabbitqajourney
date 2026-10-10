import { randomUUID } from "node:crypto";
import { createApp } from "./app";
import { createDb } from "./db";

const port = Number(process.env.API_PORT ?? 3001);
const db = await createDb();
const app = createApp({ db, bootId: randomUUID(), startedAt: new Date().toISOString() });

// Express 5 hands listen errors (e.g. EADDRINUSE) to the callback instead of throwing.
app.listen(port, (err?: Error) => {
  if (err) {
    console.error(`API could not listen on ${port}: ${err.message}`);
    process.exit(1);
  }
  console.log(`API: http://localhost:${port}/api (pg-mem, seed loaded)`);
});
