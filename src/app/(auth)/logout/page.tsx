import { signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LogoutPage() {
  await signOut({ callbackUrl: '/login' })
  redirect('/login')
}