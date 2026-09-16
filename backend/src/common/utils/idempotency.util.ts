import { Injectable } from '@nestjs/common';

export interface IdempotencyKey {
  scope: string;
  identifier: string;
}

@Injectable()
export class IdempotencyUtil {
  buildKey(scope: string, identifier: string): string {
    return `${scope}:${identifier}`;
  }

  isDuplicate(existingKeys: Set<string>, scope: string, identifier: string): boolean {
    const key = this.buildKey(scope, identifier);
    return existingKeys.has(key);
  }

  markProcessed(existingKeys: Set<string>, scope: string, identifier: string): void {
    existingKeys.add(this.buildKey(scope, identifier));
  }
}
