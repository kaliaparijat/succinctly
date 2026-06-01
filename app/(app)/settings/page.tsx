import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getProfile } from '@/app/actions/profiles'
import SettingsScreen from '@/components/settings/SettingsScreen'
import type { Preferences } from '@/lib/data/profiles'

export default async function SettingsPage() {
  const user = await getUser()
  if (!user) redirect('/signin')

  const profile = await getProfile(user.id)

  const userName = profile?.name ?? user.email ?? 'U'
  const preferences = (profile?.preferences ?? {}) as Preferences

  return <SettingsScreen userName={userName} preferences={preferences} />
}
