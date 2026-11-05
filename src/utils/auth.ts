/**
 * Extracts and validates Bearer token from Authorization header.
 * Returns the token string if valid, or null if header is missing/malformed.
 */
export function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }
  const token = authorization.slice(7).trim();
  return token || null;
}
