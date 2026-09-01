import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fljojzmfqyvovewlqaxy.supabase.co'
const supabaseKey = 'sb_publishable_g6dCsqKT06gqX1pPtkgnkA_bTXh3bo5'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey)

export const supabase = createClient(supabaseUrl, supabaseKey)