import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AuthCard from '@/components/auth/AuthCard'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const user = await getUser()
  if (user) redirect('/library')

  const { next } = await searchParams
  return <AuthCard next={next ?? '/library'} />
}
