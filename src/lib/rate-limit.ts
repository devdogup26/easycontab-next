const attempts = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(ip: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.timestamp > windowMs) {
    attempts.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}