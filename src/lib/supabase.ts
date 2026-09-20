import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase URL & Anon Key from localStorage first, then fallback to import.meta.env
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = '';
  let anonKey = '';

  try {
    const savedUrl = localStorage.getItem('sdpo_supabase_url');
    const savedKey = localStorage.getItem('sdpo_supabase_anon_key');
    if (savedUrl && savedUrl.trim()) url = savedUrl.trim();
    if (savedKey && savedKey.trim()) anonKey = savedKey.trim();
  } catch {
    // localStorage not accessible
  }

  if (!url || !anonKey) {
    const metaEnv = (import.meta as unknown as { env: Record<string, string> }).env || {};
    if (!url) url = (metaEnv.VITE_SUPABASE_URL || '').trim();
    if (!anonKey) anonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();
  }

  const isConfigured =
    Boolean(url) &&
    Boolean(anonKey) &&
    url.startsWith('https://') &&
    url !== 'https://your-project-ref.supabase.co' &&
    anonKey !== 'your-anon-public-key' &&
    anonKey.length > 20;

  return { url, anonKey, isConfigured };
}

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseCredentials().isConfigured;
};

// Singleton Supabase Client Cache
let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) {
    cachedClient = null;
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    console.log('✅ Supabase client successfully initialized.');
    return cachedClient;
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err);
    return null;
  }
}

// Create a chainable mock query builder for unconfigured states to prevent crashes
const createChainableMock = (errorMsg = 'Supabase not configured. Please check your credentials.') => {
  const mockPromise = Promise.resolve({ data: null, error: { message: errorMsg } });
  const chainable: any = {
    select: () => chainable,
    insert: () => mockPromise,
    upsert: () => mockPromise,
    update: () => chainable,
    delete: () => mockPromise,
    eq: () => chainable,
    neq: () => chainable,
    gt: () => chainable,
    gte: () => chainable,
    lt: () => chainable,
    lte: () => chainable,
    like: () => chainable,
    ilike: () => chainable,
    is: () => chainable,
    in: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    single: () => mockPromise,
    maybeSingle: () => mockPromise,
    then: (onFulfilled: any) => mockPromise.then(onFulfilled),
  };
  return chainable;
};

// Proxy export for backward compatibility with full method chaining safety
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      if (prop === 'from') {
        return () => createChainableMock();
      }
      if (prop === 'auth') {
        return {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          signOut: () => Promise.resolve({ error: null }),
        };
      }
      return () => {
        console.warn(`⚠️ Supabase method "${String(prop)}" called while unconfigured.`);
        return createChainableMock();
      };
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

export function saveSupabaseConfig(url: string, anonKey: string): { success: boolean; error?: string } {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith('https://')) {
      return { success: false, error: 'Supabase URL must start with https:// (e.g. https://yourproject.supabase.co)' };
    }
    if (cleanKey.length < 20) {
      return { success: false, error: 'Invalid Anon API Key. Please provide a valid Supabase public anon key.' };
    }

    localStorage.setItem('sdpo_supabase_url', cleanUrl);
    localStorage.setItem('sdpo_supabase_anon_key', cleanKey);
    cachedClient = null; // force reload client
    console.log('💾 Supabase configuration saved successfully to localStorage.');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save configuration' };
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem('sdpo_supabase_url');
    localStorage.removeItem('sdpo_supabase_anon_key');
    cachedClient = null;
    console.log('🧹 Supabase configuration cleared.');
  } catch (e) {
    console.error(e);
  }
}

// SQL Schema for the user to run in Supabase SQL Editor
export const SUPABASE_SQL_SETUP_SCRIPT = `-- [SQL Schema remains identical to your original code]`;
