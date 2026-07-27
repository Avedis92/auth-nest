import { z } from 'zod';

export const create2FaCodeSchema = z.object({
  code: z.string().min(6, 'Code should be no more than 6 characters long'),
});

export type Create2FaCodeDto = z.infer<typeof create2FaCodeSchema>;
