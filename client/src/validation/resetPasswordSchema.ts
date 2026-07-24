import { z } from 'zod';

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password should be at least 8 characters long'),
});

export type ResetPasswordFormDto = z.infer<typeof resetPasswordSchema>;

export interface ResetPasswordFieldErrors {
  password?: string;
}

export const validateResetPassword = (
  values: ResetPasswordFormDto,
): ResetPasswordFieldErrors => {
  const result = resetPasswordSchema.safeParse(values);
  if (result.success) return {};

  const fieldErrors: ResetPasswordFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === 'password' && !fieldErrors.password) {
      fieldErrors.password = issue.message;
    }
  }
  return fieldErrors;
};
