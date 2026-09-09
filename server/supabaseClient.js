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
 * Single-payload resilient upsert with automatic column pruning
 */
export async function safeSupabaseUpsert(table, record) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

  let currentRecord = { ...record };
  let lastError = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await supabase.from(table).upsert([currentRecord]);
    if (!error) {
      return { data, error: null };
    }

    lastError = error;

    // Match missing column error from Supabase schema cache
    const missingColMatch = error.message.match(/Could not find the '([^']+)' column/i);
    if (missingColMatch && missingColMatch[1]) {
      const missingCol = missingColMatch[1];
      console.warn(`⚠️ Supabase table '${table}' missing column '${missingCol}'. Pruning key '${missingCol}' and retrying...`);
      delete currentRecord[missingCol];
    } else {
      return { data: null, error };
    }
  }

  return { data: null, error: lastError || new Error('Exhausted column pruning retries for Supabase upsert.') };
}

/**
 * Universal Multi-Casing Resilient Supabase Insert/Upsert Engine
 * Tries multiple payload column casing formats (lowercase, snake_case, camelCase)
 * and automatically prunes non-existent columns from the Supabase schema.
 */
export async function resilientSupabaseInsert(table, payloads = []) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

  let lastError = null;

  for (const rawPayload of payloads) {
    let currentRecord = { ...rawPayload };

    for (let attempt = 0; attempt < 8; attempt++) {
      const { data, error } = await supabase.from(table).upsert([currentRecord]);
      if (!error) {
        return { data, error: null };
      }

      lastError = error;

      // Check if error is due to a missing column in Supabase table schema
      const missingColMatch = error.message.match(/Could not find the '([^']+)' column/i);
      if (missingColMatch && missingColMatch[1]) {
        delete currentRecord[missingColMatch[1]];
      } else {
        // Try the next casing payload if this one hits constraint error
        break;
      }
    }
  }

  return { data: null, error: lastError || new Error(`Failed to insert into '${table}' across all schema casing variants.`) };
}
