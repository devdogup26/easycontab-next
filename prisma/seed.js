// Seed script for EasyContab
// Run with: node prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('Starting database seed...');

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
			permissoes: {
				connect: allPerms.map(p => ({ id: p.id }))
			}
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
			permissoes: {
				connect: allPerms.slice(0, 5).map(p => ({ id: p.id }))
			}
		}
	});
	console.log('Created Perfil OPERADOR');

	// Create demo users
	const hashedPassword = await bcrypt.hash('admin123', 10);

	const adminUser = await prisma.usuario.upsert({
		where: { email: 'admin@dogup.com.br' },
		update: {},
		create: {
			email: 'admin@dogup.com.br',
			senha: hashedPassword,
			nome: 'Administrador',
			cargo: 'Gerente',
			contadorId: contador.id,
			perfilId: perfilAdmin.id
		}
	});
	console.log(`Created User: ${adminUser.email}`);

	const operadorUser = await prisma.usuario.upsert({
		where: { email: 'operador@dogup.com.br' },
		update: { perfilId: perfilOperador.id },
		create: {
			email: 'operador@dogup.com.br',
			senha: hashedPassword,
			nome: 'Operador de Teste',
			cargo: 'Assistente',
			contadorId: contador.id,
			perfilId: perfilOperador.id
		}
	});
	console.log(`Created User: ${operadorUser.email}`);

	// Create demo clientes
	const clientes = [
		{
			tipoPessoa: 'PJ',
			documento: '12345678000195',
			nomeRazao: 'Empresa Alpha Ltda',
			nomeFantasia: 'Alpha',
			regime: 'SIMPLES_NACIONAL',
			situacaoFiscal: 'REGULAR',
			logradouro: 'Rua das Flores, 123',
			cidade: 'São Paulo',
			uf: 'SP',
			cep: '01001000',
			email: 'contato@alpha.com.br',
			telefone: '(11) 99999-9999',
			responsavelTecnico: 'João Contador'
		},
		{
			tipoPessoa: 'PJ',
			documento: '98765432000160',
			nomeRazao: 'Comercial Beta S.A.',
			nomeFantasia: 'Beta S.A.',
			regime: 'NORMAL',
			situacaoFiscal: 'IRREGULAR',
			logradouro: 'Av. Brasil, 456',
			cidade: 'Rio de Janeiro',
			uf: 'RJ',
			cep: '20010000',
			email: 'contato@beta.com.br',
			telefone: '(21) 88888-8888',
			responsavelTecnico: 'Maria Contadora'
		},
		{
			tipoPessoa: 'PJ',
			documento: '45678901000129',
			nomeRazao: 'Serviços Gamma Eireli',
			nomeFantasia: 'Gamma Serviços',
			regime: 'SIMPLES_NACIONAL',
			situacaoFiscal: 'REGULARIZADO',
			logradouro: 'Rua dos Serviços, 789',
			cidade: 'Belo Horizonte',
			uf: 'MG',
			cep: '30110000',
			email: 'contato@gamma.com.br',
			telefone: '(31) 77777-7777',
			responsavelTecnico: 'Pedro Contador'
		},
		{
			tipoPessoa: 'PJ',
			documento: '78901234000173',
			nomeRazao: 'Indústria Delta Ltda',
			nomeFantasia: 'Delta Indústria',
			regime: 'NORMAL',
			situacaoFiscal: 'REGULAR',
			logradouro: 'Av. Industrial, 1000',
			cidade: 'Curitiba',
			uf: 'PR',
			cep: '80010000',
			email: 'contato@delta.com.br',
			telefone: '(41) 66666-6666',
			responsavelTecnico: 'Ana Contadora'
		},
		{
			tipoPessoa: 'PF',
			documento: '12345678901',
			nomeRazao: 'Maria da Silva MEI',
			regime: 'SIMPLES_NACIONAL',
			situacaoFiscal: 'REGULAR',
			estadoCivil: 'CASADO',
			logradouro: 'Rua das Pedras, 50',
			cidade: 'Santos',
			uf: 'SP',
			cep: '11010000',
			email: 'maria@silva.com.br',
			telefone: '(13) 99999-8888',
			responsavelTecnico: 'João Contador'
		}
	];

	for (const clienteData of clientes) {
		const cliente = await prisma.clienteFinal.upsert({
			where: { documento: clienteData.documento },
			update: {},
			create: {
				...clienteData,
				contadorId: contador.id
			}
		});
		console.log(`Created Cliente: ${cliente.nomeRazao}`);

		// Create obligations
		const currentYear = new Date().getFullYear();
		const obligationTypes = ['DCTFWEB', 'GFIP', 'DIRF'];
		const statuses = ['ENTREGUE', 'NAO_ENTREGUE', 'EM_PROCESSAMENTO'];

		for (let mes = 1; mes <= 3; mes++) {
			const tipo = obligationTypes[Math.floor(Math.random() * obligationTypes.length)];
			const status = statuses[Math.floor(Math.random() * statuses.length)];

			await prisma.obrigacao.create({
				data: {
					clienteId: cliente.id,
					tipo,
					ano: currentYear,
					mes,
					status
				}
			});
		}

		// Create certificates for PJ
		if (cliente.tipoPessoa === 'PJ') {
			await prisma.certificado.create({
				data: {
					tipo: 'A1',
					cnpj: clienteData.documento,
					validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
					status: 'VALIDO',
					clienteId: cliente.id
				}
			});
		}

		// Create parcelamentos for SIMPLES_NACIONAL
		if (cliente.regime === 'SIMPLES_NACIONAL') {
			await prisma.parcelamento.create({
				data: {
					clienteId: cliente.id,
					tipo: 'SIMPLES_NACIONAL',
					total: 50000,
					parcelas: 60,
					parcelasEmAtraso: cliente.situacaoFiscal === 'IRREGULAR' ? 3 : 0,
					inicio: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
				}
			});
		}
	}

	console.log('\nSeed completed successfully!');
	console.log('\nLogin credentials:');
	console.log('  Admin: admin@dogup.com.br / admin123');
	console.log('  Operador: operador@dogup.com.br / admin123');
}

main()
	.catch((e) => {
		console.error('Seed failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});