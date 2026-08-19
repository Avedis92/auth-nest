import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  search: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val ? val : undefined)),
});

export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
