import { createClient, SupabaseClient } from '@supabase/supabase-js'

// We use placeholder values to prevent compile-time crashes if environment variables are not set during builds.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Validate that both are set AND the anon key is a real JWT (Supabase keys start with 'eyJ')
// This prevents hanging on placeholder/malformed keys (e.g. 'sb_publishable_...' format is wrong)
const hasValidUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'))
const hasValidKey = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ'))
export const isSupabaseConfigured = hasValidUrl && hasValidKey

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

