import { createClient } from '@supabase/supabase-js'

// 📌 Credenciales desde Settings → API en Supabase
const supabaseUrl = 'https://ilzgudwjkqmjzzddirne.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsemd1ZHdqa3Ftanp6ZGRpcm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODI4NDQsImV4cCI6MjA3MDQ1ODg0NH0.EeGcelKmWHrEhFZ0lh3g5Kl-g4VvEbrllzX8yGIyf9s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
