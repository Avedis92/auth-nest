import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password should be at least 8 characters long'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
