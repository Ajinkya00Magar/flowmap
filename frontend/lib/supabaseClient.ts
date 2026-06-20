import { createClient, SupabaseClient } from '@supabase/supabase-js'

// We use placeholder values to prevent compile-time crashes if environment variables are not set during builds.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const isSupabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
