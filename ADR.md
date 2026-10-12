# Architecture Decision Records

A running log of the significant design choices in AWTY, and _why_ each one was made.

---

## 1: Push updates to the API with Postgres LISTEN/NOTIFY

### Context

The worker and the API are **two separate Node processes**. They share no memory. When the worker updates a task's progress, the API — which holds the WebSocket connections — has no way to know about it. Something has to carry "this row changed" from one process to the other, so the API can push to clients in real time.

The realistic options were:

| Option                  | How it works                                         | Trade-off                                                                                     |
| ----------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Polling**             | API queries subscribed tasks every ~500ms            | Simple, no new concepts — but constant queries, and updates lag up to the poll interval       |
| **LISTEN/NOTIFY**       | Worker `pg_notify`s; API holds a listener connection | Instant, no new infrastructure — but delivery is fire-and-forget                              |
| **pg-boss event queue** | Worker enqueues a message; API runs a consumer       | Durable and ordered — but adds latency, and stale messages pile up if the API is briefly down |

### Decision

**Postgres `LISTEN`/`NOTIFY`.** The worker sends `pg_notify` after updating a task; the API holds a dedicated listener connection and forwards each notification to subscribed sockets.

### Consequences

- Updates reach clients instantly, with no polling loop and no new service to run.
- Delivery is **fire-and-forget** — if the API is restarting at the exact moment a notification fires, it's lost. This is acceptable _only_ because the database the source of truth rather than the notification.

---

## 2: The LISTEN connection is a dedicated `pg.Client`, never the pool

### Context

The rest of the app uses a `pg.Pool` via Drizzle. It would be natural to listen on a pooled connection. But a pool exists to **recycle** connections: after a query finishes, the connection returns to the pool and may be handed to an unrelated query. A `LISTEN` needs one connection to stay subscribed indefinitely.

### Decision

Open a **standalone `pg.Client`** for listening, separate from the pool used for all other queries.

### Consequences

- The listener survives unrelated query traffic, it isn't silently recycled.
- This client must be managed by hand: reconnect logic, and a clean shutdown. The reconnect half is **not yet implemented**.

---

## 3: `pg_notify` runs in the same transaction as the `UPDATE`

### Context

The worker's write path is: update the task row, then notify. If these are two independent statements, they can disagree — the update commits but the notify fails, or vice versa. Subscribers would then be told about a change that didn't happen, or not told about one that did.

### Decision

Send the notification **inside the same transaction** as the progress update, via `tx.execute(sql`\`select pg_notify(...)\``)`. Postgres delivers NOTIFY on commit, and discards it on rollback.

### Consequences

- A notification can never describe a change that didn't actually commit. The update and the signal are atomic.
- Both the `UPDATE` and the `pg_notify` must run on the **transaction's** connection (`tx`), not the pool — using `db` inside a `db.transaction` callback would silently escape the transaction and break the guarantee.
- Applied to `updateProgress`, `complete`, and `fail` so terminal states are pushed too, not just intermediate progress.

---

## 4: Tasks resume from their stored progress, not from zero

### Context

A worker can die mid-task. The requirement is that such a task must not be stranded in `processing` forever, and ideally shouldn't restart from 0%.

### Decision

`claim()` performs an **atomic conditional update** — it only transitions a task if its status is still `pending` or `processing`, and it returns the row. The processor reads `task.progress` and computes the **remaining** work from there, rather than assuming 0%.

### Consequences

- A retried job picks up where the previous attempt left off. Progress isn't lost across a crash.
- The atomic conditional update means two workers racing to claim the same task can't both win.
- **Known limitation:** because `claim()` accepts `processing`, a job _re-delivered by pg-boss while the original worker is still alive_ could be processed alongside the original. pg-boss's expiry and heartbeat windows are configured to make this unlikely.

---

## 5: Layered architecture with hand-wired dependencies

### Context

The task values maintainable, understandable TypeScript. There's a choice between pulling in a dependency-injection framework (NestJS, Inversify, tsyringe) and keeping the structure explicit.

### Decision

A plain **layered architecture** — `controller → service → repository` — with:

- **Zod** validation at the edges (HTTP bodies and params, WebSocket messages), so untrusted input is parsed into typed values before reaching business logic.
- **Manual dependency wiring** in `containers/`, where each layer is constructed and passed its dependencies by hand.
- Interfaces (`ITasksRepository`, `ITasksService`) at the boundaries, so the processor and services depend on abstractions rather than concrete classes.

### Consequences

- No framework magic: every dependency is traceable by reading the container, and the request path is a straight line through the layers.
- Each layer is testable in isolation by passing a fake implementation of its interface.
- Costs some boilerplate compared to a framework. Accepted for a project this size, where explicitness is worth more than brevity.
- The WebSocket layer is kept out of the business logic: the processor knows nothing about sockets.
