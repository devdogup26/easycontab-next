'use client';

import { useState, useRef } from 'react';
import {
  Upload, Trash2, Shield, AlertTriangle, CheckCircle,
  XCircle, Eye, EyeOff, FileKey
} from 'lucide-react';
import styles from './page.module.css';

const CERTIFICADO_TIPOS = [
  { value: 'DV_RFB', label: 'Certificado Digital - Receita Federal' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'DCTFWEB', label: 'DCTFWeb' },
  { value: 'EFD_ICMS_IPI', label: 'EFD-ICMS/IPI' },
  { value: 'REINF', label: 'REINF' },
  { value: 'ESOCIAL', label: 'eSocial' },
];

const STATUS_CONFIG = {
  ATIVO: { icon: CheckCircle, color: '#10b981', label: 'Ativo' },
  INATIVO: { icon: XCircle, color: '#6b7280', label: 'Inativo' },
  VENCIDO: { icon: AlertTriangle, color: '#ef4444', label: 'Vencido' },
};

function formatDate(date: string | Date | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatSerial(serial: string | null): string {
  if (!serial) return '-';
  if (serial.length > 16) return `${serial.slice(0, 8)}...${serial.slice(-8)}`;
  return serial;
}

interface CertificadosTabProps {
  initialCertificados: any[];
  clientes: any[];
}

export function CertificadosTab({ initialCertificados, clientes }: CertificadosTabProps) {
  const [certificados, setCertificados] = useState(initialCertificados);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [filter, setFilter] = useState<'all' | 'ativo' | 'vencido' | 'inativo'>('all');
  const [filterCliente, setFilterCliente] = useState<string>('');

  const filteredCertificados = certificados.filter(cert => {
    if (filter !== 'all' && cert.status !== filter) return false;
    if (filterCliente && cert.clienteId !== filterCliente) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este certificado?')) return;
    try {
      const res = await fetch(`/api/certificados/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCertificados(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className={styles.certHeader}>
        <div className={styles.certFilters}>
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className={styles.filterSelect}>
            <option value="all">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="VENCIDO">Vencidos</option>
            <option value="INATIVO">Inativos</option>
          </select>
          <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)} className={styles.filterSelect}>
            <option value="">Todos os clientes</option>
            <option value="shared">Geral (sem vínculo)</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nomeRazao}</option>
            ))}
          </select>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowUploadModal(true)}>
          <Upload size={16} /> Upload Certificado
        </button>
      </div>

      {filteredCertificados.length === 0 ? (
        <div className={styles.emptyState}>
          <Shield size={48} />
          <p>Nenhum certificado cadastrado</p>
          <span>Upload um certificado digital para começar</span>
        </div>
      ) : (
        <div className={styles.certTable}>
          <div className={styles.certTableHeader}>
            <div className={styles.certColName}>Nome</div>
            <div className={styles.certColTipo}>Tipo</div>
            <div className={styles.certColCliente}>Cliente</div>
            <div className={styles.certColValidade}>Validade</div>
            <div className={styles.certColSerial}>Serial</div>
            <div className={styles.certColStatus}>Status</div>
            <div className={styles.certColActions}>Ações</div>
          </div>
          {filteredCertificados.map(cert => {
            const statusCfg = STATUS_CONFIG[cert.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.INATIVO;
            const StatusIcon = statusCfg.icon;
            return (
              <div key={cert.id} className={styles.certTableRow}>
                <div className={styles.certColName}>
                  <FileKey size={16} className={styles.certIcon} />
                  <div className={styles.certNameInfo}>
                    <span className={styles.certName}>{cert.nome}</span>
                    <span className={styles.certFilename}>{cert.filename}</span>
                  </div>
                </div>
                <div className={styles.certColTipo}>
                  {CERTIFICADO_TIPOS.find(t => t.value === cert.tipo)?.label || cert.tipo}
                </div>
                <div className={styles.certColCliente}>
                  {cert.cliente ? cert.cliente.nomeRazao : 'Geral'}
                </div>
                <div className={styles.certColValidade}>
                  <div className={styles.certValidity}>
                    <span>De: {formatDate(cert.validFrom)}</span>
                    <span>Até: {formatDate(cert.validTo)}</span>
                  </div>
                </div>
                <div className={styles.certColSerial} title={cert.serialNumber || ''}>
                  {formatSerial(cert.serialNumber)}
                </div>
                <div className={styles.certColStatus}>
                  <span className={styles.certStatus} style={{ color: statusCfg.color }}>
                    <StatusIcon size={14} />
                    {statusCfg.label}
                  </span>
                </div>
                <div className={styles.certColActions}>
                  <button className={styles.certActionBtn} title="Ver detalhes" onClick={() => setSelectedCert(cert)}>
                    <Eye size={16} />
                  </button>
                  <button className={`${styles.certActionBtn} ${styles.certActionDanger}`} title="Excluir" onClick={() => handleDelete(cert.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUploadModal && (
        <UploadCertificadoModal
          clientes={clientes}
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newCert: any) => {
            setCertificados(prev => [newCert, ...prev]);
            setShowUploadModal(false);
          }}
        />
      )}

      {selectedCert && (
        <CertificadoDetailModal certificado={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
}

function UploadCertificadoModal({ clientes, onClose, onSuccess }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('DV_RFB');
  const [clienteId, setClienteId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !password || !nome) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    formData.append('nome', nome);
    formData.append('tipo', tipo);
    if (clienteId) formData.append('clienteId', clienteId);

    try {
      const res = await fetch('/api/certificados', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao fazer upload'); return; }
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Upload Certificado Digital</h2>
        <form onSubmit={handleSubmit}>
          <div
            className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".pfx,.p12" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
            {file ? (
              <div className={styles.dropZoneFile}>
                <FileKey size={32} />
                <span>{file.name}</span>
                <span className={styles.dropZoneSize}>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <>
                <Upload size={32} />
                <p>Arraste o arquivo .pfx ou clique para selecionar</p>
              </>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Nome do certificado</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Cert ICP-Brasil Escritório" required />
            </div>
            <div className={styles.formGroup}>
              <label>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}>
                {CERTIFICADO_TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Cliente (opcional)</label>
              <select value={clienteId} onChange={e => setClienteId(e.target.value)}>
                <option value="">Geral (todos os clientes)</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nomeRazao}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Senha do certificado</label>
              <div className={styles.passwordInput}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha do arquivo .pfx" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className={styles.passwordHint}>A senha não é armazenada em texto legível</span>
            </div>
          </div>

          {error && <div className={styles.messageError}>{error}</div>}

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btn} disabled={loading}>{loading ? 'Processando...' : 'Upload'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CertificadoDetailModal({ certificado, onClose }: any) {
  const statusCfg = STATUS_CONFIG[certificado.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.INATIVO;
  const StatusIcon = statusCfg.icon;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Detalhes do Certificado</h2>
        <div className={styles.certDetailGrid}>
          <div className={styles.certDetailItem}>
            <label>Nome</label>
            <span>{certificado.nome}</span>
          </div>
          <div className={styles.certDetailItem}>
            <label>Tipo</label>
            <span>{CERTIFICADO_TIPOS.find(t => t.value === certificado.tipo)?.label}</span>
          </div>
          <div className={styles.certDetailItem}>
            <label>Cliente</label>
            <span>{certificado.cliente?.nomeRazao || 'Geral'}</span>
          </div>
          <div className={styles.certDetailItem}>
            <label>Status</label>
            <span style={{ color: statusCfg.color }}><StatusIcon size={14} />{statusCfg.label}</span>
          </div>
          <div className={styles.certDetailItem}>
            <label>Validade</label>
            <span>{formatDate(certificado.validFrom)} - {formatDate(certificado.validTo)}</span>
          </div>
          <div className={styles.certDetailItem}>
            <label>Serial</label>
            <span className={styles.mono}>{certificado.serialNumber}</span>
          </div>
          <div className={`${styles.certDetailItem} ${styles.fullWidth}`}>
            <label>Subject</label>
            <span className={styles.mono}>{certificado.subject}</span>
          </div>
          <div className={`${styles.certDetailItem} ${styles.fullWidth}`}>
            <label>Issuer</label>
            <span className={styles.mono}>{certificado.issuer}</span>
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
