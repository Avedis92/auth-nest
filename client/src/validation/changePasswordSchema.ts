import { z } from 'zod';

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(8, 'Password should be at least 8 characters long'),
  password: z.string().min(8, 'Password should be at least 8 characters long'),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export interface ChangePasswordFieldErrors {
  oldPassword?: string;
  password?: string;
}

export const validateChangePassword = (values: ChangePasswordDto): ChangePasswordFieldErrors => {
  const result = changePasswordSchema.safeParse(values);
  if (result.success) return {};

  const fieldErrors: ChangePasswordFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === 'oldPassword' && !fieldErrors.oldPassword) {
      fieldErrors.oldPassword = issue.message;
    }
    if (field === 'password' && !fieldErrors.password) {
      fieldErrors.password = issue.message;
    }
  }
  return fieldErrors;
};
