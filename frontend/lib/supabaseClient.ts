import { createClient, SupabaseClient } from '@supabase/supabase-js'

// We use placeholder values to prevent compile-time crashes if environment variables are not set during builds.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Validate both env vars are set and not placeholders.
// Supabase uses two key formats: legacy JWT (starts with 'eyJ') and new publishable keys (starts with 'sb_publishable_').
const hasValidUrl = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
)
const hasValidKey = !!(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-anon-key' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 10
)
export const isSupabaseConfigured = hasValidUrl && hasValidKey

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

