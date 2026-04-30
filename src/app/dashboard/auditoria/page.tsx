import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div>
      <h1>Auditoria</h1>
      <p>Página em construção</p>
    </div>
  )
}