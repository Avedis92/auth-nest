import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const SALT_OR_ROUNDS = 10;

export const hashAnElement = async (element: string) => {
  const hashedElement = await bcrypt.hash(element, SALT_OR_ROUNDS);
  return hashedElement;
};

// Deterministic hash for high-entropy secrets (e.g. reset tokens) that need
// to be looked up by exact match, unlike bcrypt's salted (non-deterministic) hash.
export const hashTokenForLookup = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const verifyAHashedElement = async (
  element: string,
  encrypted: string,
) => {
  const isAMatch = await bcrypt.compare(element, encrypted);
  return isAMatch;
};
