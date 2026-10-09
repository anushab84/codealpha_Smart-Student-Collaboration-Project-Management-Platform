const windows = new Map();

function createRateLimit({ windowMs = 60_000, max = 120, keyPrefix = 'api', message = 'Too many requests. Please try again later.' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const current = windows.get(key);
    const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    entry.count += 1; windows.set(key, entry);
    if (windows.size > 10000) for (const [candidate, value] of windows) if (value.resetAt <= now) windows.delete(candidate);
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.set('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return res.status(429).json({ success: false, message });
    }
    next();
  };
}

module.exports = { createRateLimit };
