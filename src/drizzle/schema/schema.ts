import { integer, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const taskStatus = pgEnum('task_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: taskStatus('status').default('pending').notNull(),
  duration: integer('duration').notNull(),
  progress: integer('progress').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
