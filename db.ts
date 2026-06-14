/**
 * db.ts — Direct Supabase client for the browser.
 *
 * The anon key is safe to expose in frontend code; RLS policies
 * (see supabase_setup.sql) control what the anon role can read/write.
 *
 * Set  VITE_SUPABASE_ANON_KEY  in your GitHub Actions secret and pass
 * it as a build-time env var in the SWA workflow.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Person, DbStatus } from './types';

const SUPABASE_URL    = 'https://jxdtfbcyqdcdpgrpzgfh.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const TABLE           = 'people';
const BUCKET          = 'Pesel';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!SUPABASE_ANON_KEY) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is not set. Add it as a GitHub secret and pass it to the build step in your SWA workflow.',
    );
  }
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

const getErrorMsg = (e: unknown): string => e instanceof Error ? e.message : String(e);

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
  } catch (e) {
    const msg = getErrorMsg(e);
    const isInvalidKey = msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('jwt');
    return {
      status: isInvalidKey ? 'unconfigured' : 'disconnected',
      message: msg,
    };
  }
}

// ─── People (SQL table) ───────────────────────────────────────────────────────

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
  if (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Failed to sync person to Supabase: ${msg}`);
  }
}

export async function dbDeletePerson(id: string): Promise<void> {
  const { error } = await getClient().from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function dbClearAll(): Promise<void> {
  const { error } = await getClient().from(TABLE).delete().not('id', 'is', null);
  if (error) throw error;
}

// ─── Storage bucket ───────────────────────────────────────────────────────────

/**
 * Uploads a document file to the "Pesel" Supabase Storage bucket
 * and returns its public URL.  The row's `idPhoto` column stores this URL
 * instead of a raw base64 string.
 *
 * Path format: <pesel>/<unix-ms>.<ext>
 */
export async function dbUploadDocument(file: File, pesel: string): Promise<string> {
  const ext  = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const path = `${pesel}/${Date.now()}.${ext}`;

  const { error: uploadError } = await getClient()
    .storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (uploadError) {
    const msg = uploadError instanceof Error ? uploadError.message : JSON.stringify(uploadError);
    throw new Error(`Document upload to Supabase failed: ${msg}`);
  }

  const { data } = getClient()
    .storage
    .from(BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}