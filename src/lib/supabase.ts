import { createClient } from '@supabase/supabase-js';

// Default to the project's Supabase credentials if environment variables are not configured in deployment
const DEFAULT_SUPABASE_URL = 'https://jkcpebpkwjkbmpuwvotc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_RZBncywp5eAF7yIb_r1ohg_zKJEzCrO';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
