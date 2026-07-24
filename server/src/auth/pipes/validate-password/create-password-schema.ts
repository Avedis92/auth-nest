import { z } from 'zod';

export const createPasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(8, 'Password should be at least 8 characters long'),
  password: z.string().min(8, 'Password should be at least 8 characters long'),
});

export type CreatePasswordDto = z.infer<typeof createPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password should be at least 8 characters long'),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema> & {
  resetToken: string;
};
