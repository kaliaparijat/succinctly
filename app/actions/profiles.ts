'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { fetchProfile, updateProfileData, updatePreferencesData } from '@/lib/data/profiles'
import type { Preferences } from '@/lib/data/profiles'

export { fetchProfile as getProfile }

export type ProfileState = { success: true } | { error: string } | null

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  await updateProfileData(user.id, name)

  revalidatePath('/settings')
  revalidatePath('/library')
  return { success: true }
}

export async function updatePreferences(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const preferences: Preferences = {
    flipSpeed: (formData.get('flipSpeed') as Preferences['flipSpeed']) ?? 'normal',
    tilt: formData.get('tilt') === 'true',
    hints: formData.get('hints') === 'true',
  }

  await updatePreferencesData(user.id, preferences)
  revalidatePath('/settings')
  return { success: true }
}
