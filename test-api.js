const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qihsgnfjqmkjmoowyfbn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpaHNnbmZqcW1ram1vb3d5ZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Mjc0MDAsImV4cCI6MjA2NTEwMzQwMH0.c9UQS_o2bRygKOEdnuRx7x7PeSf_OUGDtf9l3fMqMSQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signUp({ email: 'test123456789@example.com', password: 'password123' });
  let token = data?.session?.access_token;
  if (!token) {
    const signin = await supabase.auth.signInWithPassword({ email: 'test123456789@example.com', password: 'password123' });
    token = signin.data?.session?.access_token;
  }
  
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const res = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
      method: 'POST', headers, body: JSON.stringify({ contentType: 'image/jpeg' })
  });
  const json = await res.json();
  console.log("generate-presigned-url response:", json);
  
  // also try hitting generate-captions
  const res2 = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
      method: 'POST', headers, body: JSON.stringify({ imageId: '1f58924e-1902-4c28-a392-72973edef1ad', prompt: 'test' })
  });
  console.log("generate-captions response:", await res2.text());
}
test();
