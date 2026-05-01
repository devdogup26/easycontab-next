'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateProfile, updateEscritorio, changePassword } from './actions';
import { User, Building2, Bell, Shield, Key, Monitor, Copy, Check } from 'lucide-react';
import styles from './page.module.css';

const tabs = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'escritorio', label: 'Escritório', icon: Building2 },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
  { id: 'api', label: 'API', icon: Key },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.btn} disabled={pending}>
      {pending ? 'Salvando...' : label}
    </button>
  );
}

function ProfileForm({ user }: { user: any }) {
  const [state, formAction] = useFormState(updateProfile, null);

  return (
    <form action={formAction}>
      {state?.success && (
        <div className={`${styles.message} ${styles.messageSuccess}`}>{state.message}</div>
      )}
      {state?.error && (
        <div className={`${styles.message} ${styles.messageError}`}>{state.error}</div>
      )}

      <div className={styles.avatarSection}>
        <div className={styles.avatar}>{user?.nome?.charAt(0) || 'U'}</div>
        <div className={styles.avatarInfo}>
          <button type="button">Alterar foto</button>
          <p>JPG, PNG ou GIF. Máximo 2MB.</p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="nome">Nome completo</label>
          <input
            type="text"
            id="nome"
            name="nome"
            defaultValue={user?.nome || ''}
            placeholder="Seu nome"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={user?.email || ''}
            placeholder="seu@email.com"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="cargo">Cargo</label>
          <input type="text" id="cargo" defaultValue={user?.cargo || ''} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="perfil">Perfil</label>
          <input
            type="text"
            id="perfil"
            defaultValue={user?.perfil?.nome || 'Sem perfil'}
            readOnly
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <SubmitButton label="Salvar alterações" />
      </div>
    </form>
  );
}

function EscritorioForm({ escritorio }: { escritorio: any }) {
  const [state, formAction] = useFormState(updateEscritorio, null);

  return (
    <form action={formAction}>
      {state?.success && (
        <div className={`${styles.message} ${styles.messageSuccess}`}>{state.message}</div>
      )}
      {state?.error && (
        <div className={`${styles.message} ${styles.messageError}`}>{state.error}</div>
      )}

      <div className={styles.logoSection}>
        <div className={styles.logoPreview}>
          {escritorio?.logoUrl ? <img src={escritorio.logoUrl} alt="Logo" /> : <Building2 />}
        </div>
        <div className={styles.logoInfo}>
          <button type="button">Alterar logo</button>
          <p>JPG ou PNG. Recomendado 200x200px.</p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="escritorio-nome">Nome do escritório</label>
          <input
            type="text"
            id="escritorio-nome"
            name="nome"
            defaultValue={escritorio?.nome || ''}
            placeholder="Nome do escritório"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="crc">CRC</label>
          <input type="text" id="crc" defaultValue={escritorio?.crc || ''} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="cna">CNA</label>
          <input type="text" id="cna" defaultValue={escritorio?.cna || ''} readOnly />
        </div>
      </div>

      <div className={styles.formActions}>
        <SubmitButton label="Salvar alterações" />
      </div>
    </form>
  );
}

function NotificacoesForm() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [frequency, setFrequency] = useState('daily');

  return (
    <form>
      <div className={styles.toggleRow}>
        <div className={styles.toggleInfo}>
          <p>Alertas por email</p>
          <span>Receba notificações sobre obrigações pendentes</span>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            name="emailAlerts"
            checked={emailAlerts}
            onChange={e => setEmailAlerts(e.target.checked)}
          />
          <span className={styles.toggleSlider}></span>
        </label>
      </div>

      <div className={styles.toggleRow}>
        <div className={styles.toggleInfo}>
          <p>Lembretes de vencimento</p>
          <span>Receba lembretes antes das datas de vencimento</span>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            name="reminders"
            checked={reminders}
            onChange={e => setReminders(e.target.checked)}
          />
          <span className={styles.toggleSlider}></span>
        </label>
      </div>

      <div className={styles.toggleRow}>
        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label htmlFor="frequency">Frequência de emails</label>
          <select
            id="frequency"
            name="frequency"
            value={frequency}
            onChange={e => setFrequency(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.btn}>
          Salvar preferências
        </button>
      </div>
    </form>
  );
}

function SegurancaForm({ user }: { user: any }) {
  const [state, formAction] = useFormState(changePassword, null);

  return (
    <div>
      {state?.success && (
        <div className={`${styles.message} ${styles.messageSuccess}`}>{state.message}</div>
      )}
      {state?.error && (
        <div className={`${styles.message} ${styles.messageError}`}>{state.error}</div>
      )}

      <div className={styles.divider}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '12px' }}>
          Alterar senha
        </h3>
        <form action={formAction} style={{ maxWidth: '400px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className={styles.formGroup}>
              <label htmlFor="currentPassword">Senha atual</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                placeholder="••••••••"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="newPassword">Nova senha</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirmar nova senha</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <SubmitButton label="Atualizar senha" />
          </div>
        </form>
      </div>

      <div className={styles.divider}>
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <p>Autenticação em dois fatores (2FA)</p>
            <span>Adicione uma camada extra de segurança à sua conta</span>
          </div>
          <button type="button" className={styles.btn}>
            Ativar 2FA
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '12px' }}>
          Sessões ativas
        </h3>
        <div className={styles.sessionsList}>
          <div className={styles.session}>
            <div className={styles.sessionInfo}>
              <div className={styles.sessionIcon}>
                <Monitor size={20} />
              </div>
              <div className={styles.sessionDetails}>
                <p>Navegador atual</p>
                <span>Iniciada recentemente • Expira em 7 dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiSection() {
  const [copied, setCopied] = useState(false);

  const accessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3VhcmlvX2lkIiwiaWF0IjoxNzAz...';
  const refreshToken = 'rt_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apiTokens = [
    { name: 'Mobile App (iOS)', createdAt: '2024-01-15', lastUsed: '2024-04-20' },
    { name: 'Mobile App (Android)', createdAt: '2024-02-10', lastUsed: '2024-04-19' },
  ];

  return (
    <div>
      <div className={styles.apiInfo}>
        <Bell />
        <p>
          Use os tokens abaixo para autenticar requisições da API mobile. O token JWT expira em{' '}
          <strong>24h</strong> e o refresh token em <strong>30 dias</strong>.
        </p>
      </div>

      <div className={styles.tokenSection}>
        <h3>Access Token (JWT)</h3>
        <div className={styles.tokenInput}>
          <input type="text" readOnly value={accessToken} />
          <button type="button" onClick={() => copyToClipboard(accessToken)} title="Copiar">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <p className={styles.tokenHint}>Expira em 24 horas</p>
      </div>

      <div className={styles.tokenSection}>
        <h3>Refresh Token</h3>
        <div className={styles.tokenInput}>
          <input type="text" readOnly value={refreshToken} />
          <button type="button" onClick={() => copyToClipboard(refreshToken)} title="Copiar">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <p className={styles.tokenHint}>Expira em 30 dias</p>
      </div>

      <div className={styles.connectedApps}>
        <h3>Aplicativos conectados</h3>
        {apiTokens.map((token, i) => (
          <div key={i} className={styles.app}>
            <div className={styles.appInfo}>
              <div className={styles.appIcon}>
                <Monitor size={20} />
              </div>
              <div className={styles.appDetails}>
                <p>{token.name}</p>
                <span>
                  Criado em {token.createdAt} • Último uso {token.lastUsed}
                </span>
              </div>
            </div>
            <button type="button" className={styles.appAction}>
              Revogar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ConfiguracoesClientProps {
  usuario: any;
  escritorio: any;
}

export function ConfiguracoesClient({ usuario, escritorio }: ConfiguracoesClientProps) {
  const [activeTab, setActiveTab] = useState('perfil');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Configurações</h1>
        <p className={styles.subtitle}>Gerencie suas preferências e configurações da conta</p>
      </header>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content} style={{ padding: '24px' }}>
        {activeTab === 'perfil' && (
          <>
            <h2 className={styles.sectionTitle}>Perfil do Usuário</h2>
            <ProfileForm user={usuario} />
          </>
        )}

        {activeTab === 'escritorio' && (
          <>
            <h2 className={styles.sectionTitle}>Configurações do Escritório</h2>
            <EscritorioForm escritorio={escritorio} />
          </>
        )}

        {activeTab === 'notificacoes' && (
          <>
            <h2 className={styles.sectionTitle}>Preferências de Notificação</h2>
            <NotificacoesForm />
          </>
        )}

        {activeTab === 'seguranca' && (
          <>
            <h2 className={styles.sectionTitle}>Segurança da Conta</h2>
            <SegurancaForm user={usuario} />
          </>
        )}

        {activeTab === 'api' && (
          <>
            <h2 className={styles.sectionTitle}>API e Integrações</h2>
            <ApiSection />
          </>
        )}
      </div>
    </div>
  );
}
