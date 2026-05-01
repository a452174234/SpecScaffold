import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  taskId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  priority: z.enum(['P1', 'P2', 'P3']).nullable(),
  storyLabel: z.string().nullable(),
  parallelizable: z.boolean().default(false),
  status: z.enum(['pending', 'testing', 'test_approved', 'developing', 'testing_pass', 'completed']).default('pending'),
  testFilePath: z.string().nullable(),
  implFilePath: z.string().nullable(),
  dependencies: z.array(z.string()).nullable(),
  createdAt: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;
