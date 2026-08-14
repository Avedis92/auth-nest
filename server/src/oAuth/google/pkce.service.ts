import { Injectable } from '@nestjs/common';

interface PkceEntry {
  codeVerifier: string;
  createdAt: number;
}

@Injectable()
export class PkceService {
  private store = new Map<string, PkceEntry>();

  save(state: string, codeVerifier: string) {
    this.store.set(state, { codeVerifier, createdAt: Date.now() });
  }

  consume(state: string): string | null {
    const entry = this.store.get(state);
    if (!entry) return null;
    this.store.delete(state); // one-time use
    // Optional: reject if older than e.g. 10 minutes
    if (Date.now() - entry.createdAt > 10 * 60 * 1000) return null;
    return entry.codeVerifier;
  }
}
