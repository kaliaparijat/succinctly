import { createClient } from '@/lib/supabase/server'

export async function fetchProfile(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single()
  return data
}
