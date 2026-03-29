import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fdgdywzqaycbauveytan.supabase.co'
const supabaseAnonKey = 'sb_publishable_GGqDbZay_02PWeDcA2E3kg_M7BAYjxE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
