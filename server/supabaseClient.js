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
