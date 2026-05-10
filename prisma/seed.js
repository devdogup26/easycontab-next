// Seed script for EasyContab
// Run with: node prisma/seed.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;

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

  console.log('Cleaning existing data...');
  await prisma.notificacao.deleteMany();
  await prisma.procuracao.deleteMany();
  await prisma.parcelamento.deleteMany();
  await prisma.obrigacao.deleteMany();
  await prisma.clienteFinal.deleteMany();
  await prisma.usuario.deleteMany();
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

  const hashedPassword = await bcrypt.hash('admin123', 12);

  // ============================================
  // CREATE SUPER_ADMIN (for admin module)
  // ============================================
  await prisma.usuario.create({
    data: {
      login: 'admin@admin.com',
      email: 'admin@admin.com',
      senha: hashedPassword,
      nome: 'Administrador',
      cargo: 'Administrador da Plataforma',
      globalRole: 'SUPER_ADMIN',
      escritorioId: escritorio.id,
    },
  });
  console.log('Created SUPER_ADMIN: admin@admin.com');

  // ============================================
  // CREATE ADMIN (for client/dashboard module)
  // Login = escritorio email
  // ============================================
  await prisma.usuario.create({
    data: {
      login: 'admin@dogup.com.br',
      email: 'admin@dogup.com.br',
      senha: hashedPassword,
      nome: 'Administrador do Escritório',
      cargo: 'Administrador',
      globalRole: 'ADMIN',
      escritorioId: escritorio.id,
    },
  });
  console.log('Created ADMIN: admin@dogup.com.br\n');

  console.log('='.repeat(50));
  console.log('Seed completed successfully!');
  console.log('='.repeat(50));
  console.log('\n🔐 Login credentials:');
  console.log('');
  console.log('  Módulo ADMIN (admin.module):');
  console.log('  admin@admin.com / admin123');
  console.log('');
  console.log('  Módulo CLIENTES (dashboard):');
  console.log('  admin@dogup.com.br / admin123');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });