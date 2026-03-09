import { createClient } from '@supabase/supabase-js';

// Hardcoded for guaranteed connectivity during setup
const supabaseUrl = 'https://wllstifewvjtdrzfgbxj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbHN0aWZld3ZqdGRyemZnYnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTM0MzcsImV4cCI6MjA4ODYyOTQzN30.2w7njwiQ7KHpT5kKmeKsSW7a-0YJvEXdeCMVHgr5pCw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
