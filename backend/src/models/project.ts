import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  path: z.string().min(1),
  type: z.enum(['created', 'imported']),
  language: z.string().nullable(),
  framework: z.string().nullable(),
  status: z.enum(['active', 'archived']).default('active'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectInput = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  path: z.string().min(1, '项目路径不能为空'),
  type: z.enum(['created', 'imported']),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInput>;
