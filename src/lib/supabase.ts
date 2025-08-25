import { createClient } from '@supabase/supabase-js'

// Configuration Supabase via l'intégration Lovable
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Si les variables d'environnement ne sont pas définies, utiliser une configuration temporaire
if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
  console.warn('Variables d\'environnement Supabase non configurées. Veuillez vérifier votre intégration Supabase.')
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    }
  }
)