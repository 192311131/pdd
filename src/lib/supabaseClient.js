import { createClient } from '@supabase/supabase-js';

// Supabase client. Reads Vite env vars (VITE_ = exposed to the browser).
// The anon key is safe to ship publicly ONLY because Row Level Security is
// enabled on every table (see supabase/schema.sql).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// `isSupabaseConfigured` lets the UI degrade gracefully when keys are absent
// (e.g. local dev without a project) instead of throwing on import.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
