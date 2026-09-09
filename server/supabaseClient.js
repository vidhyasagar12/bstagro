import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  : null;

export const isSupabaseConfigured = Boolean(supabase);

if (isSupabaseConfigured) {
  console.log('⚡ Supabase Cloud Database & Storage Client initialized successfully:', supabaseUrl);
} else {
  console.warn('⚠️ Supabase environment variables not detected! Backend requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

/**
 * Resilient Supabase Upsert Helper
 * Automatically prunes non-existent columns if the target Supabase table schema lacks optional fields.
 */
export async function safeSupabaseUpsert(table, record) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

  let currentRecord = { ...record };

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await supabase.from(table).upsert([currentRecord]).select();
    if (!error) {
      return { data, error: null };
    }

    // Match missing column error from Supabase schema cache
    const missingColMatch = error.message.match(/Could not find the '([^']+)' column/i);
    if (missingColMatch && missingColMatch[1]) {
      const missingCol = missingColMatch[1];
      console.warn(`⚠️ Supabase table '${table}' missing column '${missingCol}'. Pruning key and retrying...`);
      delete currentRecord[missingCol];
    } else {
      return { data: null, error };
    }
  }

  return { data: null, error: new Error('Exhausted column pruning retries for Supabase upsert.') };
}
