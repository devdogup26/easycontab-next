'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Cliente {
  id: string;
  nomeRazao: string;
}

interface FieldErrors {
  [key: string]: string[];
}

export default function NovoTrabalhadorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState({
    clienteId: '',
    cpf: '',
    nome: '',
    dataNascimento: '',
    tipoRegime: 'CLT',
    ctps: '',
    serieCtps: '',
    ufCtps: '',
    pis: '',
    cnh: '',
    email: '',
    telefone: '',
  });

  useEffect(() => {
    fetch('/api/clientes')
      .then(res => res.json())
      .then(data => setClientes(data))
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    // Clean and prepare data
    const cleanedData = {
      clienteId: formData.clienteId,
      cpf: formData.cpf.replace(/\D/g, ''),
      nome: formData.nome.trim(),
      dataNascimento: formData.dataNascimento,
      tipoRegime: formData.tipoRegime,
      ctps: formData.ctps || undefined,
      serieCtps: formData.serieCtps || undefined,
      ufCtps: formData.ufCtps || undefined,
      pis: formData.pis?.replace(/\D/g, '') || undefined,
      cnh: formData.cnh || undefined,
      email: formData.email || undefined,
      telefone: formData.telefone || undefined,
    };

    try {
      const response = await fetch('/api/esocial/trabalhadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard/esocial');
      } else if (data.details?.fieldErrors) {
        setFieldErrors(data.details.fieldErrors);
      } else {
        alert(data.error || 'Erro ao criar trabalhador');
      }
    } catch (err) {
      alert('Erro ao criar trabalhador');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Novo Trabalhador</h1>
          <p className={styles.subtitle}>Cadastrar novo trabalhador eSocial</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Cliente</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Cliente *</label>
              <select
                name="clienteId"
                value={formData.clienteId}
                onChange={handleChange}
                className={`${styles.select} ${fieldErrors.clienteId ? styles.inputError : ''}`}
                required
              >
                <option value="">Selecione o cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>{cliente.nomeRazao}</option>
                ))}
              </select>
              {fieldErrors.clienteId && <span className={styles.fieldError}>{fieldErrors.clienteId[0]}</span>}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Dados Pessoais</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>CPF *</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                className={`${styles.input} ${fieldErrors.cpf ? styles.inputError : ''}`}
                required
                placeholder="000.000.000-00"
              />
              {fieldErrors.cpf && <span className={styles.fieldError}>{fieldErrors.cpf[0]}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Nome Completo *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={`${styles.input} ${fieldErrors.nome ? styles.inputError : ''}`}
                required
              />
              {fieldErrors.nome && <span className={styles.fieldError}>{fieldErrors.nome[0]}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Data de Nascimento *</label>
              <input
                type="date"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                className={`${styles.input} ${fieldErrors.dataNascimento ? styles.inputError : ''}`}
                required
              />
              {fieldErrors.dataNascimento && <span className={styles.fieldError}>{fieldErrors.dataNascimento[0]}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Categoria</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="EMPREGADO">Empregado</option>
                <option value="TRABALHADOR_RURAL">Trabalhador Rural</option>
                <option value="AVULSO">Avulso</option>
                <option value="AUTONOMO">Autônomo</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Documentos</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>CTPS</label>
              <input
                type="text"
                name="ctps"
                value={formData.ctps}
                onChange={handleChange}
                className={`${styles.input} ${fieldErrors.ctps ? styles.inputError : ''}`}
                placeholder="Número CTPS"
              />
              {fieldErrors.ctps && <span className={styles.fieldError}>{fieldErrors.ctps[0]}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Série CTPS</label>
              <input
                type="text"
                name="serieCtps"
                value={formData.serieCtps}
                onChange={handleChange}
                className={`${styles.input} ${fieldErrors.serieCtps ? styles.inputError : ''}`}
              />
              {fieldErrors.serieCtps && <span className={styles.fieldError}>{fieldErrors.serieCtps[0]}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>UF CTPS</label>
              <select
                name="ufCtps"
                value={formData.ufCtps}
                onChange={handleChange}
                className={`${styles.select} ${fieldErrors.ufCtps ? styles.inputError : ''}`}
              >
                <option value="">Selecione</option>
                <option value="AC">AC</option>
                <option value="AL">AL</option>
                <option value="AP">AP</option>
                <option value="AM">AM</option>
                <option value="BA">BA</option>
                <option value="CE">CE</option>
                <option value="DF">DF</option>
                <option value="ES">ES</option>
                <option value="GO">GO</option>
                <option value="MA">MA</option>
                <option value="MT">MT</option>
                <option value="MS">MS</option>
                <option value="MG">MG</option>
                <option value="PA">PA</option>
                <option value="PB">PB</option>
                <option value="PR">PR</option>
                <option value="PE">PE</option>
                <option value="PI">PI</option>
                <option value="RJ">RJ</option>
                <option value="RN">RN</option>
                <option value="RS">RS</option>
                <option value="RO">RO</option>
                <option value="RR">RR</option>
                <option value="SC">SC</option>
                <option value="SP">SP</option>
                <option value="SE">SE</option>
                <option value="TO">TO</option>
              </select>
              {fieldErrors.ufCtps && <span className={styles.fieldError}>{fieldErrors.ufCtps[0]}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>PIS/PASEP</label>
              <input
                type="text"
                name="pis"
                value={formData.pis}
                onChange={handleChange}
                className={`${styles.input} ${fieldErrors.pis ? styles.inputError : ''}`}
                placeholder="000.00000.00-0"
              />
              {fieldErrors.pis && <span className={styles.fieldError}>{fieldErrors.pis[0]}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>CNH</label>
              <input
                type="text"
                name="cnh"
                value={formData.cnh}
                onChange={handleChange}
                className={`${styles.input} ${fieldErrors.cnh ? styles.inputError : ''}`}
              />
              {fieldErrors.cnh && <span className={styles.fieldError}>{fieldErrors.cnh[0]}</span>}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Salvando...' : 'Salvar Trabalhador'}
          </button>
        </div>
      </form>
    </div>
  );
}