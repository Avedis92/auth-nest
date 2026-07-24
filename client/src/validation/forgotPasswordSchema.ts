import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export interface ForgotPasswordFieldErrors {
  email?: string;
}

export const validateForgotPassword = (
  values: ForgotPasswordDto,
): ForgotPasswordFieldErrors => {
  const result = forgotPasswordSchema.safeParse(values);
  if (result.success) return {};

  const fieldErrors: ForgotPasswordFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === 'email' && !fieldErrors.email) {
      fieldErrors.email = 'Please enter a valid email address';
    }
  }
  return fieldErrors;
};
