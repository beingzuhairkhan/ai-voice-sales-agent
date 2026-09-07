export interface IdempotencyKey {
    scope: string;
    identifier: string;
}
export declare class IdempotencyUtil {
    buildKey(scope: string, identifier: string): string;
    isDuplicate(existingKeys: Set<string>, scope: string, identifier: string): boolean;
    markProcessed(existingKeys: Set<string>, scope: string, identifier: string): void;
}
