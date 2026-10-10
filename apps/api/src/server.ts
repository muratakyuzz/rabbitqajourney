import { randomUUID } from "node:crypto";
import { createApp } from "./app";
import { createDb } from "./db";

const port = Number(process.env.API_PORT ?? 3001);
const db = await createDb();
const app = createApp({ db, bootId: randomUUID(), startedAt: new Date().toISOString() });

app.listen(port, () => {
  console.log(`API: http://localhost:${port}/api (pg-mem, seed loaded)`);
});
