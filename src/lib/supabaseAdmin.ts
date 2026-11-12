// Server only. The service role key bypasses row level security, so it must
// never reach the browser: 'server-only' fails the build if a client
// component imports this file, and the key has no NEXT_PUBLIC_ prefix.
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * For the mailing list only: reading subscribers, marking an unsubscribe,
 * re-subscribing. Null when SUPABASE_SERVICE_ROLE_KEY is not set, so callers
 * can say so instead of crashing.
 */
export const supabaseAdmin: SupabaseClient | null =
  url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null;
