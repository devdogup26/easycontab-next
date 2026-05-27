import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { parsePfxCertificate, encryptContent, determineCertStatus } from '@/lib/server/certificates';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const escritorioId = (session.user as any).escritorioId;
  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get('clienteId');

  const certificados = await prisma.certificado.findMany({
    where: {
      escritorioId,
      ...(clienteId ? { clienteId } : {}),
    },
    include: {
      cliente: { select: { id: true, nomeRazao: true, documento: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(certificados.map(c => ({ ...c, conteudo: undefined, passwordHash: undefined })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const escritorioId = (session.user as any).escritorioId;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string;
    const nome = formData.get('nome') as string;
    const tipo = formData.get('tipo') as string;
    const clienteId = (formData.get('clienteId') as string) || null;

    if (!file || !password || !nome || !tipo) {
      return NextResponse.json({ error: 'Campos obrigatórios missing' }, { status: 400 });
    }

    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pfx', 'p12'].includes(ext || '')) {
      return NextResponse.json({ error: 'Apenas arquivos .pfx e .p12 são aceitos' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsedCert;
    try {
      parsedCert = await parsePfxCertificate(buffer, password);
    } catch (parseError: any) {
      return NextResponse.json(
        { error: `Não foi possível ler o certificado. Verifique a senha. (${parseError.message})` },
        { status: 400 }
      );
    }

    const existing = await prisma.certificado.findFirst({
      where: { escritorioId, thumbprint: parsedCert.thumbprint },
    });
    if (existing) {
      return NextResponse.json({ error: 'Este certificado já foi cadastrado' }, { status: 409 });
    }

    const encryptedContent = await encryptContent(buffer);
    const passwordHash = await bcrypt.hash(password, 12);
    const status = determineCertStatus(parsedCert.validTo);

    const certificado = await prisma.certificado.create({
      data: {
        escritorioId,
        clienteId,
        nome,
        tipo: tipo as any,
        filename: file.name,
        conteudo: encryptedContent,
        passwordHash,
        subject: parsedCert.subject,
        issuer: parsedCert.issuer,
        validFrom: parsedCert.validFrom,
        validTo: parsedCert.validTo,
        serialNumber: parsedCert.serialNumber,
        thumbprint: parsedCert.thumbprint,
        status,
      },
    });

    return NextResponse.json({ ...certificado, conteudo: undefined, passwordHash: undefined }, { status: 201 });
  } catch (error: any) {
    console.error('Upload certificado error:', error);
    return NextResponse.json({ error: 'Erro ao processar certificado' }, { status: 500 });
  }
}
