import { tasks } from '../drizzle/schema/schema';

export type Task = typeof tasks.$inferSelect;
