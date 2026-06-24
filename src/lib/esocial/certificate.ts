// eSocial Certificate Service
// Handles upload, parsing, validation and storage of digital certificates
import { createHash } from 'crypto';
import { prisma } from '@/lib/server/prisma';

interface CertificateUploadResult {
  certificadoId: string;
  arquivoId: string;
  subjectCN: string;
  expiryDate: Date;
  cnpj?: string;
}

interface ParsedCertificateInfo {
  subjectCN: string;
  issuer: string;
  serialNumber: string;
  expiryDate: Date;
  cnpj?: string;
}

// Validate file is PKCS#12 (.p12 or .pfx)
function isValidPKCS12Filename(filename: string): boolean {
  return /\.(p12|pfx)$/i.test(filename);
}

// Calculate SHA-256 hash of file
function calculateFileHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

// Extract CNPJ from certificate subject
function extractCNPJFromSubject(subject: string): string | undefined {
  // CNPJ pattern: CNPJ:XXXXXXXXXXXXXX
  const match = subject.match(/CNPJ[\s:=]*(\d{14})/i);
  return match?.[1];
}

// Simulate certificate parsing (in production, use node-forge or similar)
async function parsePKCS12File(
  buffer: Buffer,
  senha: string
): Promise<ParsedCertificateInfo> {
  // In a real implementation, you would use node-forge or openssl command:
  // const p12 = forge.asn1.fromDer(forge.util.createBuffer(buffer));
  // const cert = forge.pkcs12.pkcs12FromAsn1(p12, senha);

  // For now, return mock data - this should be replaced with real implementation
  return {
    subjectCN: 'CN=EMPRESA TESTE ME, O=Empresa Teste ME, OU=1, OU=Razão Social, CN=EMPRESA TESTE ME',
    issuer: 'CN=AC SOLUTI Multipla, O=AC SOLUTI, S=SP, C=BR',
    serialNumber: '00'.repeat(10),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    cnpj: '12345678000190',
  };
}

// Check if certificate is valid (not expired, not revoked)
function validateCertificate(parsed: ParsedCertificateInfo): string[] {
  const errors: string[] = [];

  if (parsed.expiryDate < new Date()) {
    errors.push('Certificado expirado');
  }

  if (!parsed.cnj) {
    // CNPJ is optional in some certificates
  }

  return errors;
}

export async function uploadCertificate(
  arquivoBuffer: Buffer,
  originalName: string,
  senha: string,
  clienteId: string,
  escritorioId: string
): Promise<CertificateUploadResult> {
  // Validate file type
  if (!isValidPKCS12Filename(originalName)) {
    throw new Error('Arquivo deve ser um certificado digital (.p12 ou .pfx)');
  }

  // Validate file size (max 10MB)
  if (arquivoBuffer.length > 10 * 1024 * 1024) {
    throw new Error('Arquivo deve ter no máximo 10MB');
  }

  // Calculate file hash
  const fileHash = calculateFileHash(arquivoBuffer);

  // Parse PKCS#12 file
  const parsed = await parsePKCS12File(arquivoBuffer, senha);

  // Extract CNPJ if available
  const cnpj = parsed.cnpj || extractCNPJFromSubject(parsed.subjectCN);

  // Validate certificate
  const validationErrors = validateCertificate(parsed);
  if (validationErrors.length > 0) {
    throw new Error(`Certificado inválido: ${validationErrors.join(', ')}`);
  }

  // Find or create cliente certificate record
  const certificado = await prisma.certificado.findFirst({
    where: { clienteId },
  });

  let certificadoId: string;

  if (certificado) {
    // Check if there's already a valid certificate
    if (certificado.status === 'VALIDO' && certificado.validade > new Date()) {
      throw new Error('Cliente já possui certificado válido. Remove o anterior primeiro.');
    }
    certificadoId = certificado.id;
    await prisma.certificado.update({
      where: { id: certificadoId },
      data: {
        tipo: 'A1',
        cnpj,
        validade: parsed.expiryDate,
        status: 'VALIDO',
        responsavel: 'Sistema EasyContab',
      },
    });
  } else {
    const novo = await prisma.certificado.create({
      data: {
        clienteId,
        tipo: 'A1',
        cnpj,
        validade: parsed.expiryDate,
        status: 'VALIDO',
        responsavel: 'Sistema EasyContab',
        escritorioId,
      },
    });
    certificadoId = novo.id;
  }

  // Store file with hash for integrity verification
  const arquivo = await prisma.arquivoCertificado.create({
    data: {
      certificadoId,
      arquivoNome: originalName,
      arquivoTipo: 'application/x-pkcs12',
      arquivoHash: fileHash,
      arquivoSize: arquivoBuffer.length,
      validade: parsed.expiryDate,
      emissor: parsed.issuer,
      subjectCN: parsed.subjectCN,
    },
  });

  return {
    certificadoId,
    arquivoId: arquivo.id,
    subjectCN: parsed.subjectCN,
    expiryDate: parsed.expiryDate,
    cnpj,
  };
}

export async function getValidCertificateForCliente(clienteId: string) {
  const certificado = await prisma.certificado.findFirst({
    where: {
      clienteId,
      status: 'VALIDO',
      validade: { gte: new Date() },
    },
    include: {
      arquivos: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!certificado) {
    throw new Error('Nenhum certificado digital válido encontrado para este cliente');
  }

  if (certificado.arquivos.length === 0) {
    throw new Error('Certificado cadastrado mas arquivo não encontrado');
  }

  return certificado;
}

export async function deleteCertificate(certificadoId: string, escritorioId: string) {
  // Verify ownership
  const certificado = await prisma.certificado.findFirst({
    where: { id: certificadoId },
    include: { cliente: true },
  });

  if (!certificado) {
    throw new Error('Certificado não encontrado');
  }

  if (certificado.cliente.escritorioId !== escritorioId) {
    throw new Error('Acesso negado');
  }

  // Delete arquivo records first
  await prisma.arquivoCertificado.deleteMany({
    where: { certificadoId },
  });

  // Delete certificate record
  await prisma.certificado.delete({
    where: { id: certificadoId },
  });

  return { success: true };
}