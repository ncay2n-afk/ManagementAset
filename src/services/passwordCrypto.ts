/**
 * Client-side Web Crypto PBKDF2-SHA256 password hashing & verification utility.
 * Passwords are never stored in plaintext in memory caches, localStorage, or Google Sheets.
 */

const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function generateSaltHex(byteLength = 16): string {
  const salt = new Uint8Array(byteLength);
  window.crypto.getRandomValues(salt);
  return bytesToHex(salt);
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  if (!window.crypto?.subtle) {
    throw new Error('Browser Anda tidak mendukung Web Crypto API untuk enkripsi password.');
  }
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltHex),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

export async function verifyPassword(
  password: string,
  saltHex: string,
  expectedHash: string
): Promise<boolean> {
  if (!password || !saltHex || !expectedHash) return false;
  const computed = await hashPassword(password, saltHex);
  return constantTimeEqual(computed, expectedHash);
}
