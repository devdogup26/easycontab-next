# EasyContab - Especificação do Sistema

## 1. Visão Geral

**EasyContab** é um sistema de gestão contábil multi-tenant para escritórios de contabilidade. Cada escritório (tenant) gerencia seus próprios clientes, obrigações fiscais e usuários com perfis específicos.

### 1.1 Tecnologias
- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL (Neon)
- **Deploy**: Vercel
- **Autenticação**: NextAuth.js
- **Validação**: Zod + React Hook Form
- **Testes**: Vitest + Playwright
- **CI/CD**: GitHub Actions

---

## 2. Arquitetura

### 2.1 Multi-Tenant
- Cada **Escritório** é um tenant isolado
- **Usuários** pertencem a um escritório específico
- **Clientes** pertencem a um escritório específico
- **Login**: `{codigoEscritorio}_{nomeusuario}` (ex: `1_admin`, `2_joao`)
- Após login, usuário vê apenas dados do seu escritório

### 2.2 Perfis de Usuário

| Perfil | Descrição |
|--------|-----------|
| **ADMIN** | Administrador do escritório - acesso total |
| **CONTADOR** | Contador - permissões específicas a definir |
| **OPERADOR** | Operador - acesso restrito |

### 2.3 Modelo de Dados Principal

```
Escritorio
├── Usuario (perfil: ADMIN | CONTADOR | OPERADOR)
└── ClienteFinal
    ├── Obrigacao
    │   └── DCTFWeb
    ├── Parcelamento
    └── Mensagem
```

---

## 3. Módulo de Autenticação

### 3.1 Login
- **Formato de login**: `{codigoEscritorio}_{nomeusuario}`
- **Exemplo**: `1_admin`, `2_maria_contabil`
- **Validação**: Username é convertido para lowercase
- **Redirecionamento**: Após login vai para dashboard do escritório

### 3.2 Sessão
- Sessão contém: `id`, `login`, `nome`, `escritorioId`, `globalRole`
- `globalRole`: `SUPER_ADMIN` (módulo admin) ou `USUARIO` (escritório)
- Super Admin acesso apenas ao módulo `/admin`

---

## 4. Módulo Admin (Super Admin)

**Acesso**: Apenas usuários com `globalRole = 'SUPER_ADMIN'`

### 4.1 Funcionalidades
- **Dashboard Admin**: Visão geral de todos os escritórios
- **CRUD Escritórios**: Criar, editar, listar, excluir escritórios
- **Configurações**: Abas de configuração do sistema

### 4.2 CRUD de Escritórios
- Código sequencial automático (1, 2, 3...)
- Na criação, gera automaticamente usuário admin:
  - **Login**: `{codigo}_admin`
  - **Senha padrão**: `admin123`
- Nome do escritório, documento (CNPJ), email, status

### 4.3 Sidebar Admin
- Dashboard
- Escritórios
- Configurações
- **Não contém**: Gestão de usuários (é exclusivo do CRUD escritório)

---

## 5. Módulo Escritório

### 5.1 CRUD de Escritórios (via Admin)
Cada escritório possui:
- Código sequencial único
- Nome, CNPJ, email, telefone, endereço
- Status (ATIVO/INATIVO)
- Usuários vinculados

### 5.2 Gestão de Usuários (dentro do CRUD escritório)
- Criar usuário vinculado ao escritório
- **Login**: `{codigoEscritorio}_{nomeusuario}`
- Perfis: ADMIN, CONTADOR, OPERADOR
- Editar/excluir usuários
- Botão de gestão de usuários entre "Editar" e "Excluir"

---

## 6. Módulo Cliente

### 6.1 Tipos de Pessoa
- **Pessoa Jurídica (PJ)**: CNPJ
- **Pessoa Física (PF)**: CPF

### 6.2 CNPJ/CPF
- Aceita formato **numérico**: `00.000.000/0000-00`
- Aceita formato **alfanumérico**: `ABCD12XY0001AB` (14 caracteres)
- Validação: 14 caracteres para PJ, 11 para PF

### 6.3 Campos do Cliente
| Campo | Tipo | Obrigatório |
|--------|------|-------------|
| tipoPessoa | PF \| PJ | Sim |
| documento | string | Sim |
| nomeRazao | string | Sim |
| nomeFantasia | string | Não |
| estadoCivil | string | Não |
| inscricaoEstadual | string | Não |
| regime | SIMPLES_NACIONAL \| NORMAL | Sim |
| situacaoFiscal | REGULAR \| REGULARIZADO \| IRREGULAR | Não |
| logradouro | string | Não |
| bairro | string | Não |
| cidade | string | Não |
| uf | string(2) | Não |
| cep | string(8) | Não |
| email | string | Não |
| telefone | string | Não |
| responsavelTecnico | string | Não |

### 6.4 Busca Receita Federal
- Para CNPJs numéricos: Consulta à API pública (`publica.cnpj.ws`)
- Preenche automaticamente: razão social, nome fantasia, IE, endereço, etc.
- Para CNPJs alfanuméricos: Consulta não disponível (API só aceita números)

### 6.5 Listagem de Clientes
- Tabela com filtros
- Busca por nome/documento
- Ações: Editar, Ver Obrigações, Situação Fiscal, Excluir

---

## 7. Módulo Obrigações Fiscais

### 7.1 Tipos de Obrigação
- DCTFWeb
-outros tipos futuros

### 7.2 Status de Obrigação
| Status | Descrição |
|--------|-----------|
| ENTREGUE | Entregue no prazo |
| NAO_ENTREGUE | Não entregue |
| INCONSISTENCIA | Com inconsistência |
| EM_PROCESSAMENTO | Em processamento |
| OUTROS | Outros status |

### 7.3 DCTFWeb
- **Transmissão**: Endpoint `/api/obrigacoes/dctfweb/transmit`
- Status de transmissão
- Período: mês/ano

---

## 8. Módulo Parcelamentos

### 8.1 Tipos
- PARCELAMENTO_REFIS
- PARCELAMENTO_PGDAS
- PARCELAMENTO_SIMPLES
- PARCELAMENTO_ESTADUAL
- PARCELAMENTO_OUTROS

### 8.2 Status
| Status | Descrição |
|--------|-----------|
| ATIVO | Parcelamento ativo |
| INADIMPLENTE | Inadimplente |
| QUITADO | Quitado |
| CANCELADO | Cancelado |

---

## 9. Configurações do Escritório

### 9.1 Abas de Configuração
- **Dados do Escritório**: Nome, CNPJ, endereço, contato
- **Usuários**: Lista de usuários do escritório
- **Permissões**: Configuração de permissões por perfil
- **Integrações**: Configurações de API (futuro)

### 9.2 Dados do Escritório
| Campo | Descrição |
|-------|-----------|
| nome | Nome do escritório |
| documento | CNPJ |
| inscricaoEstadual | Inscrição Estadual |
| email | Email de contato |
| telefone | Telefone |
| endereco | Logradouro, número, complemento |
| bairro | Bairro |
| cidade | Cidade |
| uf | Estado (2 caracteres) |
| cep | CEP |

---

## 10. Validações

### 10.1 Schemas Zod

**createClienteSchema**:
```typescript
{
  tipoPessoa: enum['PF', 'PJ'],
  documento: union[
    regex(/^\d{14}$/, 'CNPJ 14 dígitos'),
    regex(/^[A-Z0-9]{14}$/, 'CNPJ alfanumérico 14 chars'),
    regex(/^\d{11}$/, 'CPF 11 dígitos')
  ],
  nomeRazao: string(min=1),
  regime: enum['SIMPLES_NACIONAL', 'NORMAL'],
  // ...outros campos opcionais
}
```

### 10.2 API Validation
- Todas as APIs validam input com Zod
- Retornam 400 com erros específicos
- Retornam 401 para não autenticado
- Retornam 403 para autorização negada

---

## 11. Code Quality

### 11.1 Pre-commit Hooks
```bash
npm run pre-commit
# Executa: lint && type-check && test
```

### 11.2 Scripts Disponíveis
| Script | Descrição |
|--------|-----------|
| `npm run lint` | ESLint |
| `npm run format` | Prettier (formata arquivos) |
| `npm run format:check` | Prettier (verifica) |
| `npm run type-check` | TypeScript |
| `npm run test` | Vitest |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:ci` | Vitest com coverage |
| `npm run test:e2e` | Playwright |
| `npm run pre-commit` | Lint + TypeCheck + Test |

### 11.3 Regras ESLint
- `@typescript-eslint/no-explicit-any`: warning (aceito para session casting)
- `@next/next/no-html-link-for-pages`: error (usar Link)
- Unused vars: warning

---

## 12. API Routes

### 12.1 Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/[...nextauth]` | NextAuth handlers |

### 12.2 Admin
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/escritorios` | Lista escritórios |
| POST | `/api/admin/escritorios` | Cria escritório |
| GET | `/api/admin/escritorios/[id]` | Detalha escritório |
| PUT | `/api/admin/escritorios/[id]` | Atualiza escritório |
| DELETE | `/api/admin/escritorios/[id]` | Remove escritório |

### 12.3 Escritório
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/escritorios` | Lista escritórios do admin |
| POST | `/api/escritorios` | Cria escritório |
| GET | `/api/escritorios/[id]` | Detalha escritório |
| PUT | `/api/escritorios/[id]` | Atualiza escritório |
| DELETE | `/api/escritorios/[id]` | Remove escritório |
| GET | `/api/escritorios/[id]/usuarios` | Lista usuários |
| POST | `/api/escritorios/[id]/usuarios` | Cria usuário |
| GET | `/api/escritorios/[id]/usuarios/[userId]` | Detalha usuário |
| PUT | `/api/escritorios/[id]/usuarios/[userId]` | Atualiza usuário |
| DELETE | `/api/escritorios/[id]/usuarios/[userId]` | Remove usuário |

### 12.4 Clientes
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/clientes` | Lista clientes do escritório |
| POST | `/api/clientes` | Cria cliente |
| GET | `/api/clientes/[id]` | Detalha cliente |
| PUT | `/api/clientes/[id]` | Atualiza cliente |
| DELETE | `/api/clientes/[id]` | Remove cliente |

### 12.5 CNPJ
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cnpj/[cnpj]` | Busca CNPJ na Receita Federal |

### 12.6 Obrigações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/obrigacoes` | Lista obrigações |
| POST | `/api/obrigacoes` | Cria obrigação |
| GET | `/api/obrigacoes/[id]` | Detalha obrigação |
| PUT | `/api/obrigacoes/[id]` | Atualiza obrigação |
| POST | `/api/obrigacoes/dctfweb/transmit` | Transmissão DCTFWeb |

### 12.7 Config Auxiliares
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/config-auxiliares` | Lista configurações |
| POST | `/api/config-auxiliares` | Cria configuração |
| GET | `/api/config-auxiliares/[id]` | Detalha configuração |
| PUT | `/api/config-auxiliares/[id]` | Atualiza configuração |
| DELETE | `/api/config-auxiliares/[id]` | Remove configuração |

### 12.8 Permissões
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/permissoes` | Lista permissões |

---

## 13. Rotas de Página

### 13.1 Auth
- `/login` - Página de login

### 13.2 Admin
- `/admin` - Dashboard admin
- `/admin/escritorios` - Lista escritórios
- `/admin/escritorios/[id]` - Detalhes do escritório
- `/admin/configuracoes` - Configurações do sistema

### 13.3 Dashboard (Escritório)
- `/dashboard` - Dashboard do escritório
- `/dashboard/clientes` - Lista clientes
- `/dashboard/clientes/novo` - Novo cliente
- `/dashboard/clientes/[id]` - Edita cliente
- `/dashboard/clientes/[id]/situacao-fiscal` - Situação fiscal
- `/dashboard/obrigacoes` - Lista obrigações
- `/dashboard/obrigacoes/dctfweb` - DCTFWeb
- `/dashboard/configuracoes` - Configurações do escritório
- `/dashboard/parcelamentos` - Parcelamentos
- `/dashboard/situacao-fiscal` - Situação fiscal geral
- `/dashboard/caixa-postal` - Caixa postal
- `/dashboard/certificados` - Certificados

---

## 14. Fluxo de Dados

### 14.1 Login Flow
```
1. Usuário acessa /login
2. Insere {codigo}_{nomeusuario} + senha
3. NextAuth valida credenciais
4. Se válido: redireciona para /dashboard
5. Sessão stores: escritorioId, nome, perfil, globalRole
```

### 14.2 Criação de Cliente
```
1. Acessa /dashboard/clientes/novo
2. Seleciona tipo (PJ/PF)
3. Digita CNPJ/CPF
4. Se PJ numérico: clica "Receita Federal" para buscar dados
5. Preenche campos restantes
6. Submete formulário
7. API valida e cria cliente
8. Redireciona para /dashboard/clientes
```

### 14.3 Transmissão DCTFWeb
```
1. Acessa /dashboard/obrigacoes/dctfweb
2. Seleciona cliente e período
3. Clica "Transmitir"
4. API chama serviço de transmissão
5. Atualiza status da obrigação
```

---

## 15. Regras de Negócio

### 15.1 Código Escritório
- Sequencial automático (1, 2, 3...)
- Não pode ser alterado após criação
- Usado como prefixo no login do usuário

### 15.2 Login de Usuário
- Formato: `{codigoEscritorio}_{nomeusuario}`
- Convertido para lowercase internamente
- Exemplo: `1_admin`, `2_maria`

### 15.3 Usuário Admin Automático
- Ao criar escritório, cria-se usuário admin
- Login: `{codigo}_admin`
- Senha: `admin123`
- Perfil: ADMIN

### 15.4 Validação de Documento
- CNPJ numérico: 14 dígitos (aceita formatação)
- CNPJ alfanumérico: 14 caracteres (sem formatação)
- CPF: 11 dígitos

---

## 16. Futuras Melhorias

- [ ] Permissões granulares por perfil
- [ ] Histórico de alterações
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Integração com更多 APIs governamentais
- [ ] Notificações por email
- [ ] Backup automático
- [ ] Multi-idioma
