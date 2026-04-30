// Seed script for EasyContab - GOB 360° Full Demo Data
// Run with: node prisma/seed.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;

// Decode URL-encoded characters and clean connection string
let cleanUrl = DATABASE_URL;
if (cleanUrl.includes('%40')) {
  cleanUrl = cleanUrl.replace(/%40/g, '@');
}
if (cleanUrl.includes('channel_binding=require')) {
  cleanUrl = cleanUrl.replace('channel_binding=require', 'channel_binding=prefer');
}

const pool = new Pool({ connectionString: cleanUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================
// DATA GENERATION HELPERS
// ============================================

const COMPANY_PREFIXES = ['Empresa', 'Comercial', 'Industrial', 'Serviços', 'Distribuidora', 'Logística', 'Tec', 'Digital', 'Online', 'Global'];
const COMPANY_SUFFIXES = ['Ltda', 'S.A.', 'Eireli', 'MEI', 'ME'];
const COMPANY_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega', 'Nova', 'Prime', 'Flex', 'Master', 'Power', 'Star', 'Super', 'Ultra', 'Max', 'Top', 'Prime', 'First', 'Best', 'Gold', 'Silver', 'Platinum', 'Diamond'];
const CITIES = [
  { nome: 'São Paulo', uf: 'SP' }, { nome: 'Rio de Janeiro', uf: 'RJ' }, { nome: 'Belo Horizonte', uf: 'MG' },
  { nome: 'Brasília', uf: 'DF' }, { nome: 'Salvador', uf: 'BA' }, { nome: 'Curitiba', uf: 'PR' },
  { nome: 'Porto Alegre', uf: 'RS' }, { nome: 'Recife', uf: 'PE' }, { nome: 'Fortaleza', uf: 'CE' },
  { nome: 'Goiânia', uf: 'GO' }, { nome: 'Manaus', uf: 'AM' }, { nome: 'Belém', uf: 'PA' },
  { nome: 'Vitória', uf: 'ES' }, { nome: 'Campinas', uf: 'SP' }, { nome: 'Santos', uf: 'SP' },
  { nome: 'Ribeirão Preto', uf: 'SP' }, { nome: 'São José dos Campos', uf: 'SP' }, { nome: 'Sorocaba', uf: 'SP' },
  { nome: 'Duque de Caxias', uf: 'RJ' }, { nome: 'Nova Iguaçu', uf: 'RJ' }
];

const STREET_TYPES = ['Rua', 'Av.', 'Alameda', 'Travessa', 'Praça'];
const STREET_NAMES = ['Das Flores', 'Brasil', 'São Paulo', 'Rio de Janeiro', ' Minas Gerais', 'das Acácias', 'dos Ipês', 'dos Cedros', 'das Palmeiras', 'dos Estados', 'Central', 'Norte', 'Sul', 'Leste', 'Oeste', 'Grande', 'Nova', 'Antiga', 'Principal', ' Secundária'];

function generateCNPJ() {
  const base = Math.floor(Math.random() * 99999999) + 10000000;
  const medio = Math.floor(Math.random() * 999) + 100;
  const dig1 = Math.floor(Math.random() * 99) + 1;
  const dig2 = Math.floor(Math.random() * 99) + 1;
  return `${base.toString().padStart(8, '0')}${medio.toString().padStart(3, '0')}${dig1.toString().padStart(2, '0')}${dig2.toString().padStart(2, '0')}`;
}

function generateCEP() {
  return `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}`;
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('Starting GOB 360° database seed...\n');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.mensagem.deleteMany();
  await prisma.procuracao.deleteMany();
  await prisma.certificado.deleteMany();
  await prisma.parcelamento.deleteMany();
  await prisma.obrigacao.deleteMany();
  await prisma.clienteFinal.deleteMany();
  console.log('Existing data cleaned.\n');

  // Create demo contador
  const contador = await prisma.contador.upsert({
    where: { slug: 'dogup-assessoria' },
    update: {},
    create: {
      nome: 'DOGUP Assessoria Contábil',
      slug: 'dogup-assessoria',
      tipoPessoa: 'PJ',
      documento: '12345678000190',
      email: 'admin@dogup.com.br',
      crc: 'SP123456',
      telefone: '(11) 99999-9999'
    }
  });
  console.log(`Created Contador: ${contador.nome}`);

  // Create Permissoes
  const permKeys = [
    'clientes:read', 'clientes:create', 'clientes:update', 'clientes:delete',
    'obrigacoes:read', 'obrigacoes:create', 'obrigacoes:update', 'obrigacoes:delete',
    'dctfweb:transmitir', 'dctfweb:view',
    'parcelamentos:read', 'parcelamentos:create',
    'certidoes:read', 'certidoes:create',
    'auditoria:read',
    'configuracoes',
    'usuarios:manage'
  ];

  for (const codigo of permKeys) {
    await prisma.permissao.upsert({
      where: { codigo },
      update: {},
      create: { codigo, descricao: `Acesso a ${codigo}` }
    });
  }

  const allPerms = await prisma.permissao.findMany();

  // Create ADMIN perfil
  const perfilAdmin = await prisma.perfil.upsert({
    where: { nome_contadorId: { nome: 'ADMIN', contadorId: contador.id } },
    update: { isAdmin: true },
    create: {
      nome: 'ADMIN',
      isAdmin: true,
      contadorId: contador.id,
      permissoes: { connect: allPerms.map(p => ({ id: p.id })) }
    }
  });
  console.log('Created Perfil ADMIN');

  // Create OPERADOR perfil
  const perfilOperador = await prisma.perfil.upsert({
    where: { nome_contadorId: { nome: 'OPERADOR', contadorId: contador.id } },
    update: {},
    create: {
      nome: 'OPERADOR',
      isAdmin: false,
      contadorId: contador.id,
      permissoes: { connect: allPerms.slice(0, 5).map(p => ({ id: p.id })) }
    }
  });
  console.log('Created Perfil OPERADOR\n');

  // Create demo users
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.usuario.upsert({
    where: { email: 'superadmin@dogup.com.br' },
    update: {},
    create: {
      email: 'superadmin@dogup.com.br',
      senha: hashedPassword,
      nome: 'Super Admin DOGUP',
      cargo: 'Administrador da Plataforma',
      globalRole: 'SUPER_ADMIN',
      contadorId: null
    }
  });
  console.log('Created Super Admin');

  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@dogup.com.br' },
    update: {},
    create: {
      email: 'admin@dogup.com.br',
      senha: hashedPassword,
      nome: 'Administrador',
      cargo: 'Gerente',
      globalRole: 'CONTADOR',
      contadorId: contador.id,
      perfilId: perfilAdmin.id
    }
  });
  console.log('Created Admin User');

  await prisma.usuario.upsert({
    where: { email: 'operador@dogup.com.br' },
    update: { perfilId: perfilOperador.id },
    create: {
      email: 'operador@dogup.com.br',
      senha: hashedPassword,
      nome: 'Operador de Teste',
      cargo: 'Assistente',
      globalRole: 'CONTADOR',
      contadorId: contador.id,
      perfilId: perfilOperador.id
    }
  });
  console.log('Created Operador User\n');

  // ============================================
  // CREATE 221 CLIENTS WITH CORRECT DISTRIBUTION
  // ============================================
  console.log('Creating 221 clients...');

  // Distribution targets
  const TOTAL_CLIENTS = 221;
  const SIMPLES_NACIONAL_COUNT = 155; // 70%
  const NORMAL_COUNT = 66; // 30%

  const FISCAL_SITUATION = {
    REGULAR: 90,      // 41.5%
    REGULARIZADO: 33,  // 15.2%
    IRREGULAR: 94     // 43.3%
  };

  let simplesNacCount = 0;
  let normalCount = 0;
  let regularCount = 0;
  let regularizadoCount = 0;
  let irregularCount = 0;

  const createdClients = [];

  // Create Simples Nacional clients (155)
  for (let i = 0; i < SIMPLES_NACIONAL_COUNT; i++) {
    const city = randomFromArray(CITIES);
    const cnpj = generateCNPJ();
    const name = `${randomFromArray(COMPANY_PREFIXES)} ${randomFromArray(COMPANY_NAMES)} ${randomFromArray(COMPANY_SUFFIXES)}`;
    const streetNum = randomInt(1, 999);

    // Determine fiscal situation
    let situacaoFiscal;
    if (regularCount < FISCAL_SITUATION.REGULAR) {
      situacaoFiscal = 'REGULAR';
      regularCount++;
    } else if (regularizadoCount < FISCAL_SITUATION.REGULARIZADO) {
      situacaoFiscal = 'REGULARIZADO';
      regularizadoCount++;
    } else {
      situacaoFiscal = 'IRREGULAR';
      irregularCount++;
    }

    const cliente = await prisma.clienteFinal.create({
      data: {
        tipoPessoa: 'PJ',
        documento: cnpj,
        nomeRazao: name,
        nomeFantasia: randomFromArray(COMPANY_NAMES),
        regime: 'SIMPLES_NACIONAL',
        situacaoFiscal,
        logradouro: `${randomFromArray(STREET_TYPES)} ${randomFromArray(STREET_NAMES)}, ${streetNum}`,
        cidade: city.nome,
        uf: city.uf,
        cep: generateCEP(),
        email: `contato@${cnpj.substring(0, 8)}.com.br`.toLowerCase(),
        telefone: `(${randomInt(11, 99)}) ${randomInt(90000, 99999)}-${randomInt(1000, 9999)}`,
        responsavelTecnico: randomFromArray(['João Contador', 'Maria Contadora', 'Pedro Contador', 'Ana Contadora']),
        contadorId: contador.id
      }
    });

    createdClients.push({ ...cliente, isSimplesNacional: true });
    simplesNacCount++;
    if (simplesNacCount % 50 === 0) console.log(`  Created ${simplesNacCount}/155 Simples Nacional clients...`);
  }

  // Create Normal regime clients (66)
  for (let i = 0; i < NORMAL_COUNT; i++) {
    const city = randomFromArray(CITIES);
    const cnpj = generateCNPJ();
    const name = `${randomFromArray(COMPANY_PREFIXES)} ${randomFromArray(COMPANY_NAMES)} ${randomFromArray(COMPANY_SUFFIXES)}`;
    const streetNum = randomInt(1, 999);

    let situacaoFiscal;
    if (regularCount < FISCAL_SITUATION.REGULAR) {
      situacaoFiscal = 'REGULAR';
      regularCount++;
    } else if (regularizadoCount < FISCAL_SITUATION.REGULARIZADO) {
      situacaoFiscal = 'REGULARIZADO';
      regularizadoCount++;
    } else {
      situacaoFiscal = 'IRREGULAR';
      irregularCount++;
    }

    const cliente = await prisma.clienteFinal.create({
      data: {
        tipoPessoa: 'PJ',
        documento: cnpj,
        nomeRazao: name,
        nomeFantasia: randomFromArray(COMPANY_NAMES),
        regime: 'NORMAL',
        situacaoFiscal,
        logradouro: `${randomFromArray(STREET_TYPES)} ${randomFromArray(STREET_NAMES)}, ${streetNum}`,
        cidade: city.nome,
        uf: city.uf,
        cep: generateCEP(),
        email: `contato@${cnpj.substring(0, 8)}.com.br`.toLowerCase(),
        telefone: `(${randomInt(11, 99)}) ${randomInt(90000, 99999)}-${randomInt(1000, 9999)}`,
        responsavelTecnico: randomFromArray(['João Contador', 'Maria Contadora', 'Pedro Contador', 'Ana Contadora']),
        contadorId: contador.id
      }
    });

    createdClients.push({ ...cliente, isSimplesNacional: false });
    normalCount++;
  }

  console.log(`  Created 221 clients total (155 Simples Nacional, 66 Normal)`);
  console.log(`  Fiscal situation: REGULAR=${regularCount}, REGULARIZADO=${regularizadoCount}, IRREGULAR=${irregularCount}\n`);

  // ============================================
  // CREATE OBRIGACOES (DCTFWeb focus - 36 em andamento)
  // ============================================
  console.log('Creating DCTFWeb obligations...');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Create 36 DCTFWeb obligations in various statuses
  const dctfwebStatuses = [
    { status: 'ENTREGUE', count: 18 },
    { status: 'NAO_ENTREGUE', count: 8 },
    { status: 'INCONSISTENCIA', count: 6 },
    { status: 'EM_PROCESSAMENTO', count: 4 }
  ];

  let dctfwebCreated = 0;
  for (const statusData of dctfwebStatuses) {
    for (let i = 0; i < statusData.count; i++) {
      const client = randomFromArray(createdClients);
      const mes = randomInt(1, currentMonth > 1 ? currentMonth - 1 : 1);

      // Calculate vencimento
      const nextMonth = mes === 12 ? 1 : mes + 1;
      const nextYear = mes === 12 ? currentYear + 1 : currentYear;
      const dataVencimento = new Date(nextYear, nextMonth - 1, 15);

      await prisma.obrigacao.create({
        data: {
          clienteId: client.id,
          tipo: 'DCTFWEB',
          ano: currentYear,
          mes,
          status: statusData.status,
          dataVencimento
        }
      });
      dctfwebCreated++;
    }
  }

  // Create some other obligations
  const otherObligations = ['EFD_ICMS_IPI', 'DEFIS', 'DMED', 'ECD_SPED', 'ECF_SPED', 'EFD_CONTRIBUICOES', 'ESOCIAL', 'PGDAS', 'REINF_R2099', 'REINF_R4099'];
  const obligationStatuses = ['ENTREGUE', 'NAO_ENTREGUE', 'EM_PROCESSAMENTO', 'INCONSISTENCIA', 'OUTROS'];

  for (const client of createdClients) {
    // Create 2-4 other obligations per client
    const numObligacoes = randomInt(2, 4);
    for (let i = 0; i < numObligacoes; i++) {
      const tipo = randomFromArray(otherObligations);
      const status = randomFromArray(obligationStatuses);
      const mes = randomInt(1, 12);
      const nextMonth = mes === 12 ? 1 : mes + 1;
      const nextYear = mes === 12 ? currentYear + 1 : currentYear;

      await prisma.obrigacao.create({
        data: {
          clienteId: client.id,
          tipo,
          ano: currentYear,
          mes,
          status,
          dataVencimento: new Date(nextYear, nextMonth - 1, 15)
        }
      });
    }
  }

  console.log(`  Created ${dctfwebCreated} DCTFWeb obligations\n`);

  // ============================================
  // CREATE PARCELAMENTOS WITH SPECIFIC ATRASO DATA
  // ============================================
  console.log('Creating parcelamentos with specific atraso distribution...');

  // PGFN: 29 total, 21 em atraso
  const pgfnClients = createdClients.slice(0, 29);
  for (let i = 0; i < 29; i++) {
    const parcelasEmAtraso = i < 21 ? randomInt(1, 5) : 0;
    await prisma.parcelamento.create({
      data: {
        clienteId: pgfnClients[i].id,
        tipo: 'PGFN',
        total: randomInt(50000, 500000),
        parcelas: randomInt(30, 120),
        parcelasEmAtraso,
        valorAtraso: parcelasEmAtraso > 0 ? randomInt(5000, 50000) : 0,
        inicio: new Date(Date.now() - randomInt(180, 730) * 24 * 60 * 60 * 1000)
      }
    });
  }

  // Simples Nacional: 52 total, 13 em atraso
  const simplesClients = createdClients.filter(c => c.isSimplesNacional).slice(0, 52);
  for (let i = 0; i < 52; i++) {
    const parcelasEmAtraso = i < 13 ? randomInt(1, 4) : 0;
    await prisma.parcelamento.create({
      data: {
        clienteId: simplesClients[i].id,
        tipo: 'SIMPLES_NACIONAL',
        total: randomInt(20000, 200000),
        parcelas: randomInt(24, 60),
        parcelasEmAtraso,
        valorAtraso: parcelasEmAtraso > 0 ? randomInt(2000, 20000) : 0,
        inicio: new Date(Date.now() - randomInt(180, 730) * 24 * 60 * 60 * 1000)
      }
    });
  }

  // Simplificado: 24 total, 6 em atraso
  const otherClients = createdClients.filter(c => !c.isSimplesNacional).slice(0, 24);
  for (let i = 0; i < 24; i++) {
    const parcelasEmAtraso = i < 6 ? randomInt(1, 3) : 0;
    await prisma.parcelamento.create({
      data: {
        clienteId: otherClients[i].id,
        tipo: 'SIMPLIFICADO',
        total: randomInt(10000, 100000),
        parcelas: randomInt(12, 48),
        parcelasEmAtraso,
        valorAtraso: parcelasEmAtraso > 0 ? randomInt(1000, 10000) : 0,
        inicio: new Date(Date.now() - randomInt(180, 730) * 24 * 60 * 60 * 1000)
      }
    });
  }

  // Also create some PREVIDENCIARIO and NAO_PREVIDENCIARIO
  const remainingClients = createdClients.slice(60);
  for (const client of remainingClients.slice(0, 20)) {
    await prisma.parcelamento.create({
      data: {
        clienteId: client.id,
        tipo: randomFromArray(['PREVIDENCIARIO', 'NAO_PREVIDENCIARIO']),
        total: randomInt(30000, 300000),
        parcelas: randomInt(24, 60),
        parcelasEmAtraso: randomInt(0, 2),
        valorAtraso: randomInt(0, 10000),
        inicio: new Date(Date.now() - randomInt(180, 730) * 24 * 60 * 60 * 1000)
      }
    });
  }

  console.log('  Created: 29 PGFN (21 em atraso), 52 Simples Nacional (13 em atraso), 24 Simplificado (6 em atraso)\n');

  // ============================================
  // CREATE CERTIFICADOS
  // ============================================
  console.log('Creating certificates...');

  for (const client of createdClients.slice(0, 180)) {
    const diasValidade = randomInt(-30, 180); // Some expired, some valid
    await prisma.certificado.create({
      data: {
        tipo: 'A1',
        cnpj: client.documento,
        validade: new Date(Date.now() + diasValidade * 24 * 60 * 60 * 1000),
        status: diasValidade < 0 ? 'VENCIDO' : 'VALIDO',
        responsavel: client.responsavelTecnico,
        clienteId: client.id
      }
    });
  }

  console.log('  Created 180 certificates (mix of valid and expired)\n');

  // ============================================
  // CREATE PROCURACOES E-CAC
  // ============================================
  console.log('Creating procurações e-CAC...');

  for (const client of createdClients.slice(0, 150)) {
    const diasValidade = randomInt(-15, 120);
    await prisma.procuracao.create({
      data: {
        tipo: randomFromArray(['COMPLETA', 'PARCIAL', 'LIMITADA']),
        validade: new Date(Date.now() + diasValidade * 24 * 60 * 60 * 1000),
        status: diasValidade < 0 ? 'VENCIDA' : 'VALIDA',
        clienteId: client.id
      }
    });
  }

  console.log('  Created 150 procurações\n');

  // ============================================
  // CREATE MENSAGENS E-CAC (6 relevantes não lidas)
  // ============================================
  console.log('Creating e-CAC messages...');

  const messageTitles = [
    { titulo: 'Notificação de Lançamento - DCTFWeb Janeiro/2026', tipo: 'NOTIFICACAO' },
    { titulo: 'Intimação para Regularização - IRPF 2025', tipo: 'INTIMACAO' },
    { titulo: 'Termo de Exclusão do Simples Nacional', tipo: 'TERMO_EXCLUSAO' },
    { titulo: 'Comunicado Importante - Alteração Legislação', tipo: 'INFORMATIVA' },
    { titulo: 'Boa Notícia! Parcelamento Aprovado', tipo: 'OTIMOS' },
    { titulo: 'Pendência de Documentos - PGDAS-D', tipo: 'NOTIFICACAO' }
  ];

  // Create 6 relevant unread messages
  for (const msg of messageTitles) {
    const client = randomFromArray(createdClients);
    await prisma.mensagem.create({
      data: {
        titulo: msg.titulo,
        conteudo: `Mensagem importante do e-CAC referente a ${client.nomeRazao}. Verifique os detalhes e tome as providências necessárias.`,
        tipo: msg.tipo,
        relevancia: 'RELEVANTE',
        lida: false,
        data: new Date(Date.now() - randomInt(1, 7) * 24 * 60 * 60 * 1000),
        clienteId: client.id
      }
    });
  }

  // Create some read messages
  for (let i = 0; i < 20; i++) {
    const client = randomFromArray(createdClients);
    await prisma.mensagem.create({
      data: {
        titulo: `Comunicado ${randomFromArray(['Pendência', 'Atualização', 'Alert', 'Informação'])} - ${randomInt(1000, 9999)}`,
        conteudo: 'Mensagem informativa do e-CAC.',
        tipo: randomFromArray(['NOTIFICACAO', 'INTIMACAO', 'INFORMATIVA']),
        relevancia: 'NAO_RELEVANTE',
        lida: true,
        data: new Date(Date.now() - randomInt(7, 30) * 24 * 60 * 60 * 1000),
        clienteId: client.id
      }
    });
  }

  console.log('  Created 6 relevant unread + 20 informational messages\n');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('='.repeat(50));
  console.log('Seed completed successfully!');
  console.log('='.repeat(50));
  console.log('\n📊 Data Summary:');
  console.log(`   Total Clients: 221`);
  console.log(`   - Simples Nacional: 155 (70%)`);
  console.log(`   - Normal: 66 (30%)`);
  console.log(`   - REGULAR: 90 (41.5%)`);
  console.log(`   - REGULARIZADO: 33 (15.2%)`);
  console.log(`   - IRREGULAR: 94 (43.3%)`);
  console.log(`   DCTFWeb: 36 em andamento`);
  console.log(`   Parcelamentos: PGFN 29 (21 atraso), Simples 52 (13 atraso), Simplificado 24 (6 atraso)`);
  console.log(`   Mensagens e-CAC: 6 relevantes não lidas`);
  console.log('\n🔐 Login credentials:');
  console.log('   Admin: admin@dogup.com.br / admin123');
  console.log('   Operador: operador@dogup.com.br / admin123');
  console.log('   Super Admin: superadmin@dogup.com.br / admin123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
