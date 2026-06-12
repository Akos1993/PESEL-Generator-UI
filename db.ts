/**
 * db.ts — Direct Supabase client for the browser.
 *
 * The anon key is safe to expose in frontend code; RLS policies
 * (see supabase_rls.sql) control what the anon role can read/write.
 *
 * Set  VITE_SUPABASE_ANON_KEY  in your GitHub Actions secret and pass
 * it as a build-time env var in the SWA workflow (see workflow snippet).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Person, DbStatus } from './types';

const SUPABASE_URL = 'https://jxdtfbcyqdcdpgrpzgfh.supabase.co';
// Vite embeds VITE_* vars at build time — set this secret in GitHub → Settings → Secrets
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const TABLE = 'people';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!SUPABASE_ANON_KEY) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is not set. ' +
      'Add it as a GitHub secret and pass it to the build step in your SWA workflow.',
    );
  }
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function dbHealth(): Promise<{ status: DbStatus; message: string }> {
  if (!SUPABASE_ANON_KEY) {
    return {
      status: 'unconfigured',
      message: 'VITE_SUPABASE_ANON_KEY is not set — see build environment variables.',
    };
  }
  try {
    const { error } = await getClient().from(TABLE).select('id').limit(1);
    if (error) throw error;
    return { status: 'connected', message: `Connected to ${SUPABASE_URL}` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const isInvalidKey = msg.toLowerCase().includes('invalid api key') ||
                         msg.toLowerCase().includes('jwt');
    return {
      status: isInvalidKey ? 'unconfigured' : 'disconnected',
      message: msg,
    };
  }
}

// ─── People ───────────────────────────────────────────────────────────────────

export async function dbFetchPeople(): Promise<Person[]> {
  const { data, error } = await getClient()
    .from(TABLE)
    .select('*')
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Person[];
}

export async function dbSyncPerson(person: Person): Promise<void> {
  const { error } = await getClient()
    .from(TABLE)
    .upsert(person, { onConflict: 'id' });
  if (error) throw error;
}

export async function dbDeletePerson(id: string): Promise<void> {
  const { error } = await getClient().from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function dbClearAll(): Promise<void> {
  const { error } = await getClient().from(TABLE).delete().not('id', 'is', null);
  if (error) throw error;
}