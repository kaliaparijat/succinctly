import { createClient } from '@/lib/supabase/server'

export interface Preferences {
  flipSpeed?: 'slow' | 'normal' | 'fast'
  tilt?: boolean
  hints?: boolean
}

export async function fetchProfile(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('name, preferences')
    .eq('id', userId)
    .single()
  return data
}

export async function updateProfileData(userId: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function updatePreferencesData(userId: string, preferences: Preferences) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ preferences })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}
