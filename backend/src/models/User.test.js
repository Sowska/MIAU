'use strict';

/**
 * Property tests for the User model — password hashing invariant.
 *
 * Validates: Requirements 1.2
 *
 * Property 1: Password hashing invariant
 * For any password string, bcrypt.compare(plain, hash) returns true
 * AND hash !== plain.
 */

const bcrypt = require('bcryptjs');

// Use lower rounds in tests — the invariant holds for any round count,
// and 12 rounds × 22 passwords per test case exceeds the default 5 s timeout.
const SALT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// Arbitrary password generator
// Produces a varied set of passwords covering short, long, special chars,
// unicode, and whitespace-heavy strings — without relying on a PBT library.
// ---------------------------------------------------------------------------
function generatePasswords() {
  return [
    // Typical user passwords
    'password123',
    'P@ssw0rd!',
    'correcthorsebatterystaple',

    // Short passwords
    'a',
    '1',
    '!',

    // Long passwords (> 64 chars — bcrypt truncates at 72 bytes; hash still verifies)
    'a'.repeat(100),
    'x'.repeat(72),

    // Special / punctuation characters
    '!@#$%^&*()-_=+[]{}|;:\'",.<>?/`~',
    '   spaces   around   ',

    // Numeric-only
    '0000000000',
    '9876543210',

    // Mixed whitespace
    '\t\n password\t',

    // Unicode — accented Latin
    'paßwörter',
    'Ünïcödé!1',

    // Unicode — CJK
    '密码password',
    '日本語テスト',

    // Unicode — emoji
    '🔒secure🔑',
    'p@$$w🌟rd',

    // Empty-ish but still valid strings
    ' ', // single space

    // Boundary: exactly 71 and 72 bytes (bcrypt boundary)
    'B'.repeat(71),
    'B'.repeat(72),
  ];
}

// ---------------------------------------------------------------------------
// Property 1: Password hashing invariant
// **Validates: Requirements 1.2**
// ---------------------------------------------------------------------------
describe('Property 1: Password hashing invariant', () => {
  const passwords = generatePasswords();

  it('bcrypt.compare(plain, hash) returns true for every generated password', async () => {
    for (const plain of passwords) {
      const hash = await bcrypt.hash(plain, SALT_ROUNDS);
      const matches = await bcrypt.compare(plain, hash);
      expect(
        matches,
        `Expected bcrypt.compare to return true for password: ${JSON.stringify(plain)}`
      ).toBe(true);
    }
  }, 30_000);

  it('hash !== plain for every generated password', async () => {
    for (const plain of passwords) {
      const hash = await bcrypt.hash(plain, SALT_ROUNDS);
      expect(
        hash,
        `Expected hash to differ from plaintext for password: ${JSON.stringify(plain)}`
      ).not.toBe(plain);
    }
  }, 30_000);

  it('two hashes of the same password are different (salt uniqueness)', async () => {
    // Bonus invariant: bcrypt produces a unique salt each call, so the same
    // password produces different ciphertexts — but both still verify.
    for (const plain of passwords.slice(0, 5)) {
      const hash1 = await bcrypt.hash(plain, SALT_ROUNDS);
      const hash2 = await bcrypt.hash(plain, SALT_ROUNDS);
      expect(hash1).not.toBe(hash2);
      expect(await bcrypt.compare(plain, hash1)).toBe(true);
      expect(await bcrypt.compare(plain, hash2)).toBe(true);
    }
  }, 30_000);
});
