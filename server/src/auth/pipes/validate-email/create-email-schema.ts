import { z } from 'zod';

export const createEmailSchema = z.object({
  email: z.email(),
});

export type CreateEmailDto = z.infer<typeof createEmailSchema>;
