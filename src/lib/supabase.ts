// Description: This file initializes the Supabase client. You will need to replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with the actual values from your Supabase project settings (API section).

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not defined in environment variables.');
  // You might want to throw an error or handle this more gracefully in a production app
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);