'use client'

import { Bell, Mail, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import styles from './page.module.css'

interface Message {
  id: string
  titulo: string
  conteudo: string
  tipo: string
  clienteNome: string
  data: string
}

interface CaixaPostalClientProps {
  relevantUnreadMessages: Message[]
  otherMessages: Message[]
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  NOTIFICACAO: <Bell size={16} />,
  INTIMACAO: <AlertTriangle size={16} />,
  TERMO_EXCLUSAO: <AlertTriangle size={16} />,
  INFORMATIVA: <Info size={16} />,
  OTIMOS: <CheckCircle size={16} />
}

const TIPO_COLORS: Record<string, string> = {
  NOTIFICACAO: 'var(--info)',
  INTIMACAO: 'var(--danger)',
  TERMO_EXCLUSAO: 'var(--danger)',
  INFORMATIVA: 'var(--text-secondary)',
  OTIMOS: 'var(--success)'
}

const TIPO_LABELS: Record<string, string> = {
  NOTIFICACAO: 'Notificação',
  INTIMACAO: 'Intimação',
  TERMO_EXCLUSAO: 'Termo de Exclusão',
  INFORMATIVA: 'Informativo',
  OTIMOS: 'Bom News'
}

export function CaixaPostalClient({
  relevantUnreadMessages,
  otherMessages
}: CaixaPostalClientProps) {
  const unreadCount = relevantUnreadMessages.length

  return (
    <div className={styles.content}>
      {/* Priority Alert Banner */}
      {unreadCount > 0 && (
        <div className={styles.alertBanner}>
          <div className={styles.alertBannerIcon}>
            <Bell size={20} />
          </div>
          <p className={styles.alertBannerText}>
            Você tem <strong>{unreadCount} mensagens relevantes</strong> não lidas no e-CAC.
            Ignorar essas mensagens pode afetar a consulta de obrigações e situação fiscal.
          </p>
        </div>
      )}

      {/* Relevant Unread Messages */}
      {unreadCount > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.badgeCount}>{unreadCount}</span>
            Mensagens Relevantes Não Lidas
          </h2>
          <div className={styles.messagesList}>
            {relevantUnreadMessages.map(msg => (
              <div key={msg.id} className={styles.messageCard}>
                <div className={styles.messageHeader}>
                  <div
                    className={styles.messageType}
                    style={{ color: TIPO_COLORS[msg.tipo] || 'var(--text-secondary)' }}
                  >
                    {TIPO_ICONS[msg.tipo] || <Mail size={16} />}
                    <span>{TIPO_LABELS[msg.tipo] || msg.tipo}</span>
                  </div>
                  <span className={styles.messageDate}>{msg.data}</span>
                </div>
                <h3 className={styles.messageTitle}>{msg.titulo}</h3>
                <p className={styles.messageContent}>{msg.conteudo}</p>
                <div className={styles.messageFooter}>
                  <span className={styles.messageCliente}>{msg.clienteNome}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Messages */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitleOther}>Todas as Mensagens</h2>
        <div className={styles.messagesList}>
          {otherMessages.length === 0 && unreadCount === 0 ? (
            <div className={styles.emptyState}>
              <Mail size={48} />
              <p>Nenhuma mensagem encontrada</p>
            </div>
          ) : (
            otherMessages.map(msg => (
              <div
                key={msg.id}
                className={`${styles.messageCard} ${msg.relevancia === 'RELEVANTE' && !msg.lida ? styles.unread : ''}`}
              >
                <div className={styles.messageHeader}>
                  <div
                    className={styles.messageType}
                    style={{ color: TIPO_COLORS[msg.tipo] || 'var(--text-secondary)' }}
                  >
                    {TIPO_ICONS[msg.tipo] || <Mail size={16} />}
                    <span>{TIPO_LABELS[msg.tipo] || msg.tipo}</span>
                  </div>
                  <div className={styles.messageMeta}>
                    {msg.relevancia === 'RELEVANTE' && !msg.lida && (
                      <span className={styles.unreadBadge}>Não lida</span>
                    )}
                    <span className={styles.messageDate}>{msg.data}</span>
                  </div>
                </div>
                <h3 className={styles.messageTitle}>{msg.titulo}</h3>
                <p className={styles.messageContent}>{msg.conteudo}</p>
                <div className={styles.messageFooter}>
                  <span className={styles.messageCliente}>{msg.clienteNome}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
