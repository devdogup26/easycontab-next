import { prisma } from '@/lib/server/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { updateCliente } from '../actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditClientePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { id } = await params
  const contadorId = (session.user as any).contadorId

  const cliente = await prisma.clienteFinal.findFirst({
    where: { id, contadorId }
  })

  if (!cliente) {
    redirect('/dashboard/clientes')
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        Editar Cliente
      </h1>

      <form action={updateCliente.bind(null, id)} method="POST">
        <input type="hidden" name="id" value={id} />

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Nome/Razão Social *
              </label>
              <input
                type="text"
                name="nomeRazao"
                defaultValue={cliente.nomeRazao}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Nome Fantasia
              </label>
              <input
                type="text"
                name="nomeFantasia"
                defaultValue={cliente.nomeFantasia || ''}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Tipo de Pessoa *
              </label>
              <select
                name="tipoPessoa"
                defaultValue={cliente.tipoPessoa}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              >
                <option value="PF">Pessoa Física (PF)</option>
                <option value="PJ">Pessoa Jurídica (PJ)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Documento (CPF/CNPJ) *
              </label>
              <input
                type="text"
                name="documento"
                defaultValue={cliente.documento}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Inscrição Estadual
              </label>
              <input
                type="text"
                name="inscricaoEstadual"
                defaultValue={cliente.inscricaoEstadual || ''}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Cidade
              </label>
              <input
                type="text"
                name="cidade"
                defaultValue={cliente.cidade || ''}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Estado (UF)
              </label>
              <input
                type="text"
                name="estado"
                defaultValue={cliente.uf || ''}
                maxLength={2}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Telefone
              </label>
              <input
                type="text"
                name="telefone"
                defaultValue={cliente.telefone || ''}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              defaultValue={cliente.email || ''}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            type="submit"
            style={{ padding: '0.625rem 1.25rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.375rem', fontWeight: 500 }}
          >
            Salvar Alterações
          </button>
          <a
            href="/dashboard/clientes"
            style={{ padding: '0.625rem 1.25rem', backgroundColor: '#9ca3af', color: 'white', borderRadius: '0.375rem', fontWeight: 500, textDecoration: 'none' }}
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}