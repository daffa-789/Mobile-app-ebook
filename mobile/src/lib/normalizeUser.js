// DISALIN dari src/lib/normalizers.js (normalizeUser)

const pick = (source, ...keys) => {
  if (!source) return undefined;
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
};

export const normalizeUser = (data = {}) => {
  const isPro = Boolean(pick(data, 'is_pro', 'isPro'));
  return {
    id: data.id ?? null,
    name: data.name ?? '',
    email: data.email ?? '',
    phone: pick(data, 'phone') ?? '',
    role: data.role === 'admin' ? 'admin' : 'user',
    loginMethod: pick(data, 'login_method', 'loginMethod') ?? 'email',
    isPro,
    subscriptionPeriod: isPro ? (pick(data, 'subscription_period', 'subscriptionPeriod') ?? null) : null,
    subscriptionExpiresAt: isPro ? (pick(data, 'subscription_expires_at', 'subscriptionExpiresAt') ?? null) : null,
    createdAt: pick(data, 'created_at', 'createdAt') ?? null,
  };
};
