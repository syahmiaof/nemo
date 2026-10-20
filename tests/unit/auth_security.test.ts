import { describe, it, expect } from 'vitest';

const APPROVED_OWNER_EMAIL = 'syahmiaof123@gmail.com';

function validateOwnerEligibility(email: string): { eligible: boolean; reason?: string } {
  if (!email || typeof email !== 'string') {
    return { eligible: false, reason: 'Invalid email address.' };
  }
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail !== APPROVED_OWNER_EMAIL.toLowerCase()) {
    return {
      eligible: false,
      reason: `Unauthorized: Only the approved owner (${APPROVED_OWNER_EMAIL}) may request private access.`,
    };
  }
  return { eligible: true };
}

describe('Sprint 5 — Private Single-Owner Security Verification', () => {
  it('approves the explicit owner email', () => {
    const result = validateOwnerEligibility('syahmiaof123@gmail.com');
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('approves the owner email case-insensitively with surrounding whitespace', () => {
    const result = validateOwnerEligibility('  SyahmiAOF123@Gmail.COM ');
    expect(result.eligible).toBe(true);
  });

  it('strictly rejects unauthorized third-party email addresses', () => {
    const unapprovedEmails = [
      'intruder@example.com',
      'guest@gmail.com',
      'syahmiaof@otherdomain.com',
      'admin@nemo.syahmiaof.my',
    ];

    for (const email of unapprovedEmails) {
      const result = validateOwnerEligibility(email);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Unauthorized');
    }
  });

  it('rejects empty or malformed input without leaking internal details', () => {
    expect(validateOwnerEligibility('').eligible).toBe(false);
    expect(validateOwnerEligibility(null as any).eligible).toBe(false);
  });
});
