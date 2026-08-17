import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './hash.js';

describe('hash utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(50);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);
      const result = await verifyPassword(password, hashed);

      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashed = await hashPassword(password);
      const result = await verifyPassword(wrongPassword, hashed);

      expect(result).toBe(false);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashed = await hashPassword(password);
      const result = await verifyPassword(password, hashed);

      expect(result).toBe(true);
    });
  });
});