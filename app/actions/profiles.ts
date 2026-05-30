'use server'

import { fetchProfile } from '@/lib/data/profiles'

export async function getProfile(userId: string) {
  return fetchProfile(userId)
}
