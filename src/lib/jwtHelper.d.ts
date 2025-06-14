/**
 * Type declarations for JWT helper functions
 */

export function decodeJWT(token: string): any;
export function getAdvertiserIdFromToken(token: string): number | null;
