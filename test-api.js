import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wllstifewvjtdrzfgbxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbHN0aWZld3ZqdGRyemZnYnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTM0MzcsImV4cCI6MjA4ODYyOTQzN30.2w7njwiQ7KHpT5kKmeKsSW7a-0YJvEXdeCMVHgr5pCw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'testai_' + Date.now() + '@lavrsmarket.cz';
  const { data, error } = await supabase.auth.signUp({ email, password: 'password123' });
  console.log('SignUp:', error ? error.message : 'Success');
  
  if (!error) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password: 'password123' });
    console.log('SignIn:', signInError ? signInError.message : 'Success');
  }
}
run();
