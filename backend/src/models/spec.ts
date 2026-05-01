import { z } from 'zod';

export const SpecSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  branch: z.string().nullable(),
  description: z.string().nullable(),
  specFilePath: z.string().nullable(),
  status: z.enum(['draft', 'clarified', 'planned', 'tasked']).default('draft'),
  createdAt: z.string(),
});

export type Spec = z.infer<typeof SpecSchema>;
