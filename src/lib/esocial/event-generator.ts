// eSocial XML Event Generator
import { format } from 'date-fns';

const ESocial_VERSION = 'S-1.2';
const ESocial_NAMESPACE = 'http://www.esocial.gov.br/schemas/envio/eventos/versao/S-1.2/2019-02-01';

interface EventContext {
  cliente: {
    documento: string;
    nomeRazao: string;
  };
  ambiente: '1' | '2';  // 1=Produção, 2=Homologação
  processoEmissor: '1' | '2' | '3' | '4' = '1';
  versaoProcesso: string;
}

function generateId(tipo: string, documento: string, sequencial: number): string {
  return `ID{tipo}{documento}{sequencial.toString().padStart(8, '0')}`;
}

function buildEnvelope(eventXml: string, protocolo: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="${ESocial_NAMESPACE}"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.esocial.gov.br/schemas/envio/eventos/versao/S-1.2/2019-02-01">
  <envioEvento>
    <protocoloEnvio>${protocolo}</protocoloEnvio>
  </envioEvento>
  ${eventXml}
</eSocial>`;
}

// ============================================
// S-1200 - Remuneração de trabalhador não optante pelo Simples
// ============================================
export function generateS1200Xml(
  ctx: EventContext,
  dados: {
    TrabalhadorCpf: string;
    TrabalhadorNis?: string;
    dmDev: {
      ideDmDev: string;
      codCateg: string;
      vrTotBcIRRF?: number;
      vrTotRetDep?: number;
    }[];
  },
  protocolo: string
): string {
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
  const id = generateId('S1200', ctx.cliente.documento, 1);

  let dmDevXml = '';
  for (const dev of dados.dmDev) {
    dmDevXml += `
        <dmDev>
          <ideDmDev>${dev.ideDmDev}</ideDmDev>
          <codCateg>${dev.codCateg}</codCateg>
          ${dev.vrTotBcIRRF !== undefined ? `<vrTotBcIRRF>${dev.vrTotBcIRRF.toFixed(2)}</vrTotBcIRRF>` : ''}
          ${dev.vrTotRetDep !== undefined ? `<vrTotRetDep>${dev.vrTotRetDep.toFixed(2)}</vrTotRetDep>` : ''}
        </dmDev>`;
  }

  const eventoXml = `
  <evento id="${id}">
    <eSocial>
      <evtRemun>
        <Id>${id}</Id>
        <ideEvento>
          <tpAmb>${ctx.ambiente}</tpAmb>
          <procEmi>${ctx.processoEmissor}</procEmi>
          <verProc>${ctx.versaoProcesso}</verProc>
        </ideEvento>
        <ideEmpregador>
          <nrInsc>${ctx.cliente.documento}</nrInsc>
        </ideEmpregador>
        <ideTrabalhador>
          <cpfTrab>${dados.TrabalhadorCpf}</cpfTrab>
          ${dados.TrabalhadorNis ? `<nisTrab>${dados.TrabalhadorNis}</nisTrab>` : ''}
        </ideTrabalhador>
        ${dmDevXml}
      </evtRemum>
    </eSocial>
  </evento>`;

  return buildEnvelope(eventoXml, protocolo);
}

// ============================================
// S-1210 - Pagamentos de rendimentos do trabalho
// ============================================
export function generateS1210Xml(
  ctx: EventContext,
  dados: {
    TrabalhadorCpf: string;
    TrabalhadorNis?: string;
    infoPgto: {
      ideDmDev: string;
      dtPgto: string;
      vrPgt: number;
      formaPgto?: string;
    }[];
  },
  protocolo: string
): string {
  const id = generateId('S1210', ctx.cliente.documento, 1);

  let infoPgtoXml = '';
  for (const pg of dados.infoPgto) {
    infoPgtoXml += `
        <infoPgto>
          <ideDmDev>${pg.ideDmDev}</ideDmDev>
          <dtPgto>${pg.dtPgto}</dtPgto>
          <vrPgt>${pg.vrPgt.toFixed(2)}</vrPgt>
          ${pg.formaPgto ? `<formaPgto>${pg.formaPgto}</formaPgto>` : ''}
        </infoPgto>`;
  }

  const eventoXml = `
  <evento id="${id}">
    <eSocial>
      <evtPgtos>
        <Id>${id}</Id>
        <ideEvento>
          <tpAmb>${ctx.ambiente}</tpAmb>
          <procEmi>${ctx.processoEmissor}</procEmi>
          <verProc>${ctx.versaoProcesso}</verProc>
        </ideEvento>
        <ideEmpregador>
          <nrInsc>${ctx.cliente.documento}</nrInsc>
        </ideEmpregador>
        <ideTrabalhador>
          <cpfTrab>${dados.TrabalhadorCpf}</cpfTrab>
          ${dados.TrabalhadorNis ? `<nisTrab>${dados.TrabalhadorNis}</nisTrab>` : ''}
        </ideTrabalhador>
        ${infoPgtoXml}
      </evtPgtos>
    </eSocial>
  </evento>`;

  return buildEnvelope(eventoXml, protocolo);
}

// ============================================
// S-1250 - Benefícios - FGTS
// ============================================
export function generateS1250Xml(
  ctx: EventContext,
  dados: {
    TrabalhadorCpf: string;
    TrabalhadorNis?: string;
    infoBenPrDS: {
      ideBenPrDS: string;
      cnpjOrigem?: string;
      dtIniBeneficio?: string;
      vrBene?: number;
    }[];
  },
  protocolo: string
): string {
  const id = generateId('S1250', ctx.cliente.documento, 1);

  let infoBenXml = '';
  for (const ben of dados.infoBenPrDS) {
    infoBenXml += `
        <infoBenPrDS>
          <ideBenPrDS>${ben.ideBenPrDS}</ideBenPrDS>
          ${ben.cnpjOrigem ? `<cnpjOrigem>${ben.cnpjOrigem}</cnpjOrigem>` : ''}
          ${ben.dtIniBeneficio ? `<dtIniBeneficio>${ben.dtIniBeneficio}</dtIniBeneficio>` : ''}
          ${ben.vrBene !== undefined ? `<vrBene>${ben.vrBene.toFixed(2)}</vrBene>` : ''}
        </infoBenPrDS>`;
  }

  const eventoXml = `
  <evento id="${id}">
    <eSocial>
      <evtBenPrDS>
        <Id>${id}</Id>
        <ideEvento>
          <tpAmb>${ctx.ambiente}</tpAmb>
          <procEmi>${ctx.processoEmissor}</procEmi>
          <verProc>${ctx.versaoProcesso}</verProc>
        </ideEvento>
        <ideEmpregador>
          <nrInsc>${ctx.cliente.documento}</nrInsc>
        </ideEmpregador>
        <ideTrabalhador>
          <cpfTrab>${dados.TrabalhadorCpf}</cpfTrab>
          ${dados.TrabalhadorNis ? `<nisTrab>${dados.TrabalhadorNis}</nisTrab>` : ''}
        </ideTrabalhador>
        ${infoBenXml}
      </evtBenPrDS>
    </eSocial>
  </evento>`;

  return buildEnvelope(eventoXml, protocolo);
}

// ============================================
// S-1299 - Fechamento dos eventos do FGTS
// ============================================
export function generateS1299Xml(
  ctx: EventContext,
  dados: {
    dtFechamento: string;
    indApuracao: '1' | '2';
    perApur: string;
  },
  protocolo: string
): string {
  const id = generateId('S1299', ctx.cliente.documento, 1);

  const eventoXml = `
  <evento id="${id}">
    <eSocial>
      <evtFechaEvtg>
        <Id>${id}</Id>
        <ideEvento>
          <tpAmb>${ctx.ambiente}</tpAmb>
          <procEmi>${ctx.processoEmissor}</procEmi>
          <verProc>${ctx.versaoProcesso}</verProc>
        </ideEvento>
        <ideEmpregador>
          <nrInsc>${ctx.cliente.documento}</nrInsc>
        </ideEmpregador>
        <dtFechamento>${dados.dtFechamento}</dtFechamento>
        <idePeriodo>
          <indApuracao>${dados.indApuracao}</indApuracao>
          <perApur>${dados.perApur}</perApur>
        </idePeriodo>
      </evtFechaEvtg>
    </eSocial>
  </evento>`;

  return buildEnvelope(eventoXml, protocolo);
}

// ============================================
// S-2200 - Cadastramento inicial do trabalhador
// ============================================
export function generateS2200Xml(
  ctx: EventContext,
  dados: {
    cpfTrab: string;
    nisTrab?: string;
    nmTrab: string;
    dtNascto: string;
    paisNascto: string;
    paisNac: string;
    dtAdm: string;
    tipoRegPrev: string;
    cnh?: string;
  },
  protocolo: string
): string {
  const id = generateId('S2200', ctx.cliente.documento, 1);

  const eventoXml = `
  <evento id="${id}">
    <eSocial>
      <evtAdmissao>
        <Id>${id}</Id>
        <ideEvento>
          <tpAmb>${ctx.ambiente}</tpAmb>
          <procEmi>${ctx.processoEmissor}</procEmi>
          <verProc>${ctx.versaoProcesso}</verProc>
        </ideEvento>
        <ideEmpregador>
          <nrInsc>${ctx.cliente.documento}</nrInsc>
        </ideEmpregador>
        <vinculo>
          <cpfTrab>${dados.cpfTrab}</cpfTrab>
          <nisTrab>${dados.nisTrab || ''}</nisTrab>
          <nmTrab>${dados.nmTrab}</nmTrab>
          <dtNascto>${dados.dtNascto}</dtNascto>
          <paisNascto>${dados.paisNascto}</paisNascto>
          <paisNac>${dados.paisNac}</paisNac>
          <dtAdm>${dados.dtAdm}</dtAdm>
          <tpRegPrev>${dados.tipoRegPrev}</tpRegPrev>
          ${dados.cnh ? `<cnh>${dados.cnh}</cnh>` : ''}
        </vinculo>
      </evtAdmissao>
    </eSocial>
  </evento>`;

  return buildEnvelope(eventoXml, protocolo);
}

// ============================================
// Generate protocol number for tracking
// ============================================
export function generateProtocolo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}${random}`;
}

// ============================================
// Event generator factory
// ============================================
export function generateEventoXml(
  tipo: string,
  ctx: EventContext,
  dados: any,
  protocolo?: string
): string {
  const proto = protocolo || generateProtocolo();

  switch (tipo) {
    case 'S_1200':
      return generateS1200Xml(ctx, dados, proto);
    case 'S_1210':
      return generateS1210Xml(ctx, dados, proto);
    case 'S_1250':
      return generateS1250Xml(ctx, dados, proto);
    case 'S_1299':
      return generateS1299Xml(ctx, dados, proto);
    case 'S_2200':
      return generateS2200Xml(ctx, dados, proto);
    default:
      throw new Error(`Tipo de evento ${tipo} ainda não implementado`);
  }
}