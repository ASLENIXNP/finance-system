import { createClient } from '@supabase/supabase-js';

// Default to the project's Supabase credentials if environment variables are not configured in deployment
const DEFAULT_SUPABASE_URL = 'https://jkcpebpkwjkbmpuwvotc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_RZBncywp5eAF7yIb_r1ohg_zKJEzCrO';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// A network outage must not leave pages permanently loading or saving. Local
// storage remains the immediate source of truth and requests retry on the next
// normal page action.
const SUPABASE_REQUEST_TIMEOUT_MS = 15_000;

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const sourceSignal = init?.signal;
  const abortFromSource = () => controller.abort(sourceSignal?.reason);

  if (sourceSignal?.aborted) {
    abortFromSource();
  } else {
    sourceSignal?.addEventListener('abort', abortFromSource, { once: true });
  }

  const timeoutId = globalThis.setTimeout(() => {
    controller.abort(new DOMException('Supabase request timed out', 'TimeoutError'));
  }, SUPABASE_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeoutId);
    sourceSignal?.removeEventListener('abort', abortFromSource);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
});
