import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AuthCard from '@/components/auth/AuthCard'

export default async function SignInPage() {
  const user = await getUser()
  if (user) redirect('/library')

  return <AuthCard />
}
