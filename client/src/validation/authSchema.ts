import { z } from 'zod';

export const authCredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password should be at least 8 characters long'),
});

export type AuthCredentialsDto = z.infer<typeof authCredentialsSchema>;

export interface FieldErrors {
  email?: string;
  password?: string;
}

export const validateAuthCredentials = (values: AuthCredentialsDto): FieldErrors => {
  const result = authCredentialsSchema.safeParse(values);
  if (result.success) return {};

  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === 'email' && !fieldErrors.email) {
      fieldErrors.email = 'Please enter a valid email address';
    }
    if (field === 'password' && !fieldErrors.password) {
      fieldErrors.password = issue.message;
    }
  }
  return fieldErrors;
};
