import { RESERVED_SUBDOMAINS } from '@classo/config';

/**
 * PRD REG-05: Subdomain validation
 * - Lowercase letters, digits, hyphen
 * - 3 to 30 characters
 * - Cannot start or end with a hyphen
 * - Reserved words blocked (admin, api, www, app, support, etc.)
 */
export function validateSubdomainFormat(subdomain: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = subdomain.trim();

  if (trimmed.length < 3 || trimmed.length > 30) {
    return {
      valid: false,
      error: 'Subdomain must be between 3 and 30 characters long.',
    };
  }

  // PRD REG-05: Lowercase letters, digits, hyphen only
  if (/[A-Z]/.test(trimmed)) {
    return {
      valid: false,
      error: 'Subdomain must be lowercase only (no uppercase letters).',
    };
  }

  const regex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  if (!regex.test(trimmed)) {
    return {
      valid: false,
      error:
        'Subdomain can only contain lowercase letters, numbers, and hyphens (cannot start or end with a hyphen).',
    };
  }

  const reserved = new Set(RESERVED_SUBDOMAINS as readonly string[]);
  if (reserved.has(trimmed)) {
    return {
      valid: false,
      error: `"${trimmed}" is a reserved word and cannot be used as a subdomain.`,
    };
  }

  return { valid: true };
}
