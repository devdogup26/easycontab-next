// Seed script for EasyContab - Superadmin Only
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

async function main() {
  console.log('Starting EasyContab database seed...\n');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.mensagem.deleteMany();
  await prisma.procuracao.deleteMany();
  await prisma.certificado.deleteMany();
  await prisma.parcelamento.deleteMany();
  await prisma.obrigacao.deleteMany();
  await prisma.clienteFinal.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.perfil.deleteMany();
  await prisma.escritorio.deleteMany();
  console.log('Existing data cleaned.\n');

  // ============================================
  // CREATE ESCRITORIO
  // ============================================
  const escritorio = await prisma.escritorio.create({
    data: {
      codigo: 1,
      nome: 'DOGUP Assessoria Contábil',
      documento: '12345678000190',
      email: 'admin@dogup.com.br',
      telefone: '(11) 99999-9999',
      crc: 'SP123456',
      status: 'ATIVO',
      tipoPessoa: 'PJ',
      cidade: 'São Paulo',
      uf: 'SP',
      responsavel: 'Contador Responsável',
      dataVencimento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`Created Escritorio: ${escritorio.nome}`);

  // ============================================
  // CREATE PERMISSOES
  // ============================================
  const permKeys = [
    'clientes:read',
    'clientes:create',
    'clientes:update',
    'clientes:delete',
    'obrigacoes:read',
    'obrigacoes:create',
    'obrigacoes:update',
    'obrigacoes:delete',
    'dctfweb:transmitir',
    'dctfweb:view',
    'parcelamentos:read',
    'parcelamentos:create',
    'certidoes:read',
    'certidoes:create',
    'auditoria:read',
    'configuracoes',
    'usuarios:manage',
  ];

  for (const codigo of permKeys) {
    await prisma.permissao.upsert({
      where: { codigo },
      update: {},
      create: { codigo, descricao: `Acesso a ${codigo}` },
    });
  }
  console.log('Created Permissoes');

  const allPerms = await prisma.permissao.findMany();

  // ============================================
  // CREATE PERFIS
  // ============================================
  const perfilAdmin = await prisma.perfil.create({
    data: {
      nome: 'ADMIN',
      isAdmin: true,
      escritorioId: escritorio.id,
      permissoes: { connect: allPerms.map(p => ({ id: p.id })) },
    },
  });

  await prisma.perfil.create({
    data: {
      nome: 'CONTADOR',
      isAdmin: false,
      escritorioId: escritorio.id,
      permissoes: { connect: allPerms.slice(0, 8).map(p => ({ id: p.id })) },
    },
  });

  await prisma.perfil.create({
    data: {
      nome: 'OPERADOR',
      isAdmin: false,
      escritorioId: escritorio.id,
      permissoes: { connect: allPerms.slice(0, 5).map(p => ({ id: p.id })) },
    },
  });

  console.log('Created Perfis: ADMIN, CONTADOR, OPERADOR');

  // ============================================
  // CREATE SUPERADMIN USER
  // ============================================
  const hashedPassword = await bcrypt.hash('admin123', 12);

  await prisma.usuario.create({
    data: {
      login: 'admin',
      email: 'admin@dogup.com.br',
      senha: hashedPassword,
      nome: 'Administrador',
      cargo: 'Administrador da Plataforma',
      globalRole: 'SUPER_ADMIN',
      escritorioId: escritorio.id,
      perfilId: perfilAdmin.id,
    },
  });
  console.log('Created Superadmin User\n');

  console.log('='.repeat(50));
  console.log('Seed completed successfully!');
  console.log('='.repeat(50));
  console.log('\n🔐 Login credentials:');
  console.log('   admin@dogup.com.br / admin123');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
