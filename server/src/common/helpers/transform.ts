import { DATA_FORMAT } from '../types';

export const revertToInitialBinaryForm = (
  data: string,
  format: DATA_FORMAT,
) => {
  return Buffer.from(data, format);
};

export const transformABinaryToACertainFormat = (
  buffer: Buffer,
  format: DATA_FORMAT,
) => {
  return buffer.toString(format);
};
