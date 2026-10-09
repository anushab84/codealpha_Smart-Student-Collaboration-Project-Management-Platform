function validateConfig(env = process.env) {
  const errors = [];
  if (!env.MONGO_URI || /<[^>]+>|your_username|your_password/i.test(env.MONGO_URI)) errors.push('MONGO_URI must be configured with real database credentials');
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || /replace_with|your_jwt/i.test(env.JWT_SECRET)) errors.push('JWT_SECRET must be a non-placeholder secret with at least 32 characters');
  const origins = (env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((item) => item.trim()).filter(Boolean);
  if (env.NODE_ENV === 'production' && !env.CORS_ORIGINS) errors.push('CORS_ORIGINS must explicitly list the production frontend origin');
  if (env.TRUST_PROXY_HOPS && (!/^\d+$/.test(env.TRUST_PROXY_HOPS) || Number(env.TRUST_PROXY_HOPS) > 3)) errors.push('TRUST_PROXY_HOPS must be an integer from 0 to 3');
  if (env.MAX_UPLOAD_BYTES && (!/^\d+$/.test(env.MAX_UPLOAD_BYTES) || Number(env.MAX_UPLOAD_BYTES) < 1 || Number(env.MAX_UPLOAD_BYTES) > 50 * 1024 * 1024)) errors.push('MAX_UPLOAD_BYTES must be between 1 byte and 50 MiB');
  for (const origin of origins) {
    let parsed;
    try { parsed = new URL(origin); } catch { errors.push(`Invalid CORS origin: ${origin}`); continue; }
    if (parsed.origin !== origin || parsed.username || parsed.password) errors.push(`CORS_ORIGINS entries must be bare origins without paths or credentials: ${origin}`);
    if (env.NODE_ENV === 'production' && parsed.protocol !== 'https:') errors.push('Production CORS_ORIGINS must use HTTPS');
  }
  if (errors.length) throw new Error(`Invalid server configuration:\n- ${errors.join('\n- ')}`);
  return { origins };
}

module.exports = validateConfig;
