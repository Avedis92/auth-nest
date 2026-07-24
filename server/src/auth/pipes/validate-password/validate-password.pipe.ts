import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ValidatePasswordPipe<T> implements PipeTransform<unknown, T> {
  constructor(private schema: ZodType<T>) {}
  transform(value: any) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'The user did not provide valid password',
        errors: result.error.format(),
      });
    }
    return value;
  }
}
