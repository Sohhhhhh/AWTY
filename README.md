# AWTY — Are We There Yet?

A real-time task processing service. A client submits a task that takes a while,
gets back a task ID immediately, and follows its progress over a WebSocket
connection until it completes.

## How it works

```
        POST /api/tasks  {duration: 10}
 Client ──────────────────────────────► API ──► INSERT tasks ──► pg-boss queue
    ▲                                    │
    │                                    │ (HTTP returns immediately)
    │                                    │
    │                                    ▼
    │                              Worker process
    │                              claims task, ticks progress 1s at a time,
    │                              UPDATE tasks + pg_notify (same transaction)
    │                                    │
    │         LISTEN task_updates ◄──────┘
    │              │
    └── WebSocket ─┘  progress / completed / failed
```

Two separate processes:

- **API** (`src/server.ts`) — serves REST + WebSocket. Holds a Postgres
  `LISTEN` connection so it hears the moment a task's row changes.
- **Worker** (`src/worker.ts`) — pulls jobs off the pg-boss queue, updates
  progress, and sends a `pg_notify` in the _same transaction_ as the `UPDATE`.

They never share memory. Postgres is the only thing connecting them — the
task row is the source of truth, and `LISTEN/NOTIFY` is just the doorbell.

---

## Tech stack

| Concern          | Choice                    |
| ---------------- | ------------------------- |
| HTTP             | Express 5                 |
| WebSocket        | `ws`                      |
| Queue            | pg-boss (Postgres-backed) |
| Database         | PostgreSQL 16             |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Validation       | Zod                       |
| Runtime          | Node 20, TypeScript, tsx  |

---

## Quick start (Docker)

Requires Docker + Docker Compose.

```bash
cp .env.example .env     # then edit the credentials
docker-compose up --build -d
```

That starts four things:

| Service   | What it does                                    |
| --------- | ----------------------------------------------- |
| `db`      | PostgreSQL 16, data persisted in a named volume |
| `migrate` | runs `drizzle-kit migrate` once, then exits     |
| `app`     | the API + WebSocket server on `:3000`           |
| `worker`  | the task processor                              |

`app` and `worker` wait for `migrate` to finish, and `migrate` waits for `db`
to be healthy.

The API is at <http://localhost:3000>.

---

## Manual setup (no Docker)

You need a running PostgreSQL and a database called `awty`.

```bash
cp .env.example .env      # point DATABASE_URL at your Postgres
npm install

npm run db:migrate

npm run dev
npm run worker            # in a second terminal
```

The API and the worker **must both be running** — the API accepts tasks, the
worker processes them.

---

## HTTP API

### Create a task

```
POST /api/tasks
Content-Type: application/json

{ "duration": 10 }
```

`duration` is how many seconds the task should take. Integer, **1–600**.

Returns immediately — the task runs in the background.

```json
{
  "data": {
    "id": "2ef22e4c-823a-4a38-98fb-a9457cf23ed8",
    "status": "pending",
    "duration": 10,
    "progress": 0,
    "createdAt": "2026-10-12T19:41:24.641Z",
    "updatedAt": "2026-10-12T19:41:24.641Z"
  }
}
```

**Errors**

- `400` — missing/invalid `duration`, or body isn't valid JSON
- `500` — couldn't reach the database

### Get a task

```
GET /api/tasks/:id
```

`id` must be a valid UUID.

```json
{
  "data": {
    "id": "2ef22e4c-823a-4a38-98fb-a9457cf23ed8",
    "status": "processing",
    "duration": 10,
    "progress": 50,
    "createdAt": "2026-10-12T19:41:24.641Z",
    "updatedAt": "2026-10-12T19:41:27.941Z"
  }
}
```

**Status values:** `pending` → `processing` → `completed` (progress 100) or `failed`.

**Errors**

- `400` — `id` isn't a valid UUID
- `404` — no task with that id

---

## WebSocket API

Connect to `ws://localhost:3000/ws`.

### Subscribe

Send:

```json
{ "type": "subscribe", "taskId": "2ef22e4c-823a-4a38-98fb-a9457cf23ed8" }
```

`taskId` must be a valid UUID that exists, otherwise you get an error message
back (the connection stays open).

On a successful subscribe you immediately receive the task's **current state** —
so a client reconnecting mid-task picks up from wherever the task is now, not
from zero.

### Updates

For as long as the task runs, you receive a message whenever its state changes —
roughly once per second for a running task:

```json
{ "id": "...", "status": "processing", "progress": 25, ... }
```

followed by, on completion:

```json
{ "id": "...", "status": "completed", "progress": 100, ... }
```

These messages are the task row. Multiple clients can subscribe to the same task
and all of them receive the updates.

### Errors

Invalid JSON, an invalid subscribe message, or an unknown task id each return an
object with an `error` field. The socket is not closed.

## Database

Drizzle schema in `src/drizzle/schema/schema.ts`, migrations in
`src/drizzle/migrations`.

pg-boss creates its own `pgboss` schema automatically when the worker first
starts. You don't manage it.

---

## Project structure

```
src/
  server.ts              API entry point
  worker.ts              worker entry point
  app.ts                 Express app + middleware
  config/                env, drizzle, pg-boss, websocket setup
  routes/                route definitions
  controllers/           request → service
  services/              business logic
  repositories/          SQL / Drizzle queries
  workers/               task processor (progress loop, failure handling)
  queue/                 pg-boss queue + dead-letter setup
  websocket/
    ws.handler.ts        parse + validate subscribe messages
    subscriptions.ts     which sockets want which task
    task-watcher.ts      LISTEN for updates, forward to subscribers
  dtos/                  Zod schemas
  validators/            express + Zod middleware
  containers/            manual dependency wiring
  middlewares/           error handling, 404, health check
  drizzle/               schema + migrations
```

The pattern throughout is **controller → service → repository**, with Zod
validation at the edge and dependencies wired by hand in `containers/`.

---
