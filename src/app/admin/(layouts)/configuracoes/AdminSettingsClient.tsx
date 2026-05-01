'use client';

import { useState } from 'react';
import { Settings, Bell, Shield, Key, Save, Check } from 'lucide-react';
import styles from '../dashboard/page.module.css';

type TabId = 'geral' | 'notificacoes' | 'seguranca' | 'api';

const TABS = [
  { id: 'geral' as TabId, label: 'Geral', icon: Settings },
  { id: 'notificacoes' as TabId, label: 'Notificações', icon: Bell },
  { id: 'seguranca' as TabId, label: 'Segurança', icon: Shield },
  { id: 'api' as TabId, label: 'API', icon: Key },
];

// Geral Tab
function GeralTab() {
  const [formData, setFormData] = useState({
    nomePlataforma: 'EasyContab',
    emailContato: 'contato@easycontab.com.br',
    telefone: '(11) 3000-0000',
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to database
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Nome da Plataforma</label>
          <input
            type="text"
            value={formData.nomePlataforma}
            onChange={e => setFormData({ ...formData, nomePlataforma: e.target.value })}
            required
          />
        </div>

        <div className={styles.formField}>
          <label>Email de Contato</label>
          <input
            type="email"
            value={formData.emailContato}
            onChange={e => setFormData({ ...formData, emailContato: e.target.value })}
            required
          />
        </div>

        <div className={styles.formField}>
          <label>Telefone</label>
          <input
            type="text"
            value={formData.telefone}
            onChange={e => setFormData({ ...formData, telefone: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.modalActions}>
        <button type="submit" className={styles.submitBtn}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}

// Notificações Tab
function NotificacoesTab() {
  const [formData, setFormData] = useState({
    emailAlertas: 'alertas@easycontab.com.br',
    alertasVencimento: true,
    alertasNovosClientes: true,
    alertasObrigacoes: true,
    templateEmail: 'predefinido',
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Email para Alertas</label>
          <input
            type="email"
            value={formData.emailAlertas}
            onChange={e => setFormData({ ...formData, emailAlertas: e.target.value })}
            required
          />
        </div>

        <div className={styles.formField}>
          <label>Template de Email</label>
          <select
            value={formData.templateEmail}
            onChange={e => setFormData({ ...formData, templateEmail: e.target.value })}
          >
            <option value="predefinido">Padrão EasyContab</option>
            <option value="customizado">Customizado</option>
          </select>
        </div>
      </div>

      <div className={styles.toggleGroup}>
        <h4>Tipos de Alertas</h4>

        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={formData.alertasVencimento}
            onChange={e => setFormData({ ...formData, alertasVencimento: e.target.checked })}
          />
          <span>Alertas de Vencimento de Mensalidade</span>
        </label>

        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={formData.alertasNovosClientes}
            onChange={e => setFormData({ ...formData, alertasNovosClientes: e.target.checked })}
          />
          <span>Novos Clientes Cadastrados</span>
        </label>

        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={formData.alertasObrigacoes}
            onChange={e => setFormData({ ...formData, alertasObrigacoes: e.target.checked })}
          />
          <span>Pendências de Obrigações Acessórias</span>
        </label>
      </div>

      <div className={styles.modalActions}>
        <button type="submit" className={styles.submitBtn}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}

// Segurança Tab
function SegurancaTab() {
  const [formData, setFormData] = useState({
    politicaSenha: 'forte',
    expiracaoSessao: 24,
    limiteTentativas: 5,
    doisFatores: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Política de Senhas</label>
          <select
            value={formData.politicaSenha}
            onChange={e => setFormData({ ...formData, politicaSenha: e.target.value })}
          >
            <option value="fraca">Fraca (mín. 4 caracteres)</option>
            <option value="media">Média (mín. 8 caracteres)</option>
            <option value="forte">Forte (mín. 12 caracteres, maiúsculas, números)</option>
          </select>
        </div>

        <div className={styles.formField}>
          <label>Expiração de Sessão (horas)</label>
          <select
            value={formData.expiracaoSessao}
            onChange={e => setFormData({ ...formData, expiracaoSessao: Number(e.target.value) })}
          >
            <option value={8}>8 horas</option>
            <option value={24}>24 horas</option>
            <option value={48}>48 horas</option>
            <option value={168}>7 dias</option>
          </select>
        </div>

        <div className={styles.formField}>
          <label>Limite de Tentativas de Login</label>
          <select
            value={formData.limiteTentativas}
            onChange={e => setFormData({ ...formData, limiteTentativas: Number(e.target.value) })}
          >
            <option value={3}>3 tentativas</option>
            <option value={5}>5 tentativas</option>
            <option value={10}>10 tentativas</option>
          </select>
        </div>
      </div>

      <div className={styles.toggleGroup}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={formData.doisFatores}
            onChange={e => setFormData({ ...formData, doisFatores: e.target.checked })}
          />
          <span>Autenticação em Dois Fatores (2FA)</span>
        </label>
      </div>

      <div className={styles.modalActions}>
        <button type="submit" className={styles.submitBtn}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}

// API Tab
function ApiTab() {
  const [apiKey] = useState('sk_live_easycontab_xxxxxxxxxxxxxxxxxxxxxx');
  const [showKey, setShowKey] = useState(false);

  return (
    <div className={styles.apiContainer}>
      <div className={styles.apiInfo}>
        <h4>API Key</h4>
        <p>Use esta chave para integrar com a API do EasyContab</p>
      </div>

      <div className={styles.apiKeyBox}>
        <code>{showKey ? apiKey : 'sk_live_easycontab_••••••••••••••••••••••••'}</code>
        <button className={styles.toggleKeyBtn} onClick={() => setShowKey(!showKey)}>
          {showKey ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      <div className={styles.apiEndpoints}>
        <h4>Endpoints Principais</h4>
        <ul>
          <li>
            <code>GET /api/v1/clientes</code> - Listar clientes
          </li>
          <li>
            <code>GET /api/v1/obrigacoes</code> - Listar obrigações
          </li>
          <li>
            <code>POST /api/v1/transmissao</code> - Transmitir DCTFWeb
          </li>
        </ul>
      </div>
    </div>
  );
}

export function AdminSettingsClient() {
  const [activeTab, setActiveTab] = useState<TabId>('geral');

  return (
    <div className={styles.settingsContainer}>
      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
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

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'geral' && <GeralTab />}
        {activeTab === 'notificacoes' && <NotificacoesTab />}
        {activeTab === 'seguranca' && <SegurancaTab />}
        {activeTab === 'api' && <ApiTab />}
      </div>
    </div>
  );
}
