/**
 * Client-side rate limiter for brute force protection
 * Tracks failed attempts per email and enforces lockout periods
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const STORAGE_KEY = 'auth_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes window

function getRecords(): Record<string, AttemptRecord> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveRecords(records: Record<string, AttemptRecord>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Silent fail
  }
}

export function checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number; lockoutSeconds: number } {
  const normalizedEmail = email.toLowerCase().trim();
  const records = getRecords();
  const record = records[normalizedEmail];
  const now = Date.now();

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockoutSeconds: 0 };
  }

  // Check if locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    const lockoutSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, lockoutSeconds };
  }

  // Reset if lockout expired or attempt window expired
  if (record.lockedUntil && now >= record.lockedUntil) {
    delete records[normalizedEmail];
    saveRecords(records);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockoutSeconds: 0 };
  }

  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    delete records[normalizedEmail];
    saveRecords(records);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockoutSeconds: 0 };
  }

  const remaining = MAX_ATTEMPTS - record.count;
  return { allowed: remaining > 0, remainingAttempts: Math.max(0, remaining), lockoutSeconds: 0 };
}

export function recordFailedAttempt(email: string): { locked: boolean; lockoutSeconds: number } {
  const normalizedEmail = email.toLowerCase().trim();
  const records = getRecords();
  const now = Date.now();

  const record = records[normalizedEmail] || { count: 0, firstAttempt: now, lockedUntil: null };

  // Reset if window expired
  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    record.count = 0;
    record.firstAttempt = now;
    record.lockedUntil = null;
  }

  record.count++;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    records[normalizedEmail] = record;
    saveRecords(records);
    return { locked: true, lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  records[normalizedEmail] = record;
  saveRecords(records);
  return { locked: false, lockoutSeconds: 0 };
}

export function clearAttempts(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const records = getRecords();
  delete records[normalizedEmail];
  saveRecords(records);
}
