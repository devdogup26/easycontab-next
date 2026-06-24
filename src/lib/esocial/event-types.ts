// eSocial Event Types - TypeScript definitions

export interface IdeEvento {
  tpAmb: '1' | '2';  // 1=Produção, 2=Homologação
  procEmi: '1' | '2' | '3' | '4';  // 1=Empregador, 2=App terceiro, 3=App via órgão público, 4=App via operador federal
  verProc: string;  // Versão do processo
}

export interface IdeEmpregador {
  nrInsc: string;  // CNPJ/CPF - 14 digits
  ideEmpregador?: string;  // For CAEPF or CEI
}

export interface IdeTrabalhador {
  cpfTrab: string;  // 11 digits
  nisTrab?: string;  // PIS/NIT - 11 digits
}

export interface DmDev {
  ideDmDev: string;  // Identificador do demonstrativo
  codCateg: string;  // Código da categoria - 3 digits
  vrTotBcIRRF?: number;
  vrTotRetDep?: number;
}

// ============================================
// S-1200 - Remuneração de trabalhador não optante pelo Simples
// ============================================
export interface S1200Data {
  evtRemun: {
    Id?: string;
    ideEvento: IdeEvento;
    ideEmpregador: IdeEmpregador;
    ideTrabalhador: IdeTrabalhador;
    dmDev: DmDev[];
  };
}

// ============================================
// S-1202 - Remuneração de optante pelo Simples
// ============================================
export interface S1202Data {
  evtRemun: {
    Id?: string;
    ideEvento: IdeEvento;
    ideEmpregador: IdeEmpregador;
    ideTrabalhador: IdeTrabalhador;
    dmDev: DmDev[];
  };
}

// ============================================
// S-1210 - Pagamentos de rendimentos do trabalho
// ============================================
export interface InfoPgto {
  ideDmDev: string;
  dtPgto: string;  // YYYY-MM-DD
  vrPgt: number;
  formaPgto: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30' | '31' | '32' | '33' | '34' | '35' | '36' | '37' | '38' | '39' | '40' | '41' | '42' | '43' | '44' | '45' | '46' | '47' | '48' | '49' | '50' | '51' | '52' | '53' | '54' | '55' | '56' | '57' | '58' | '59' | '60' | '61' | '62' | '63' | '64' | '65' | '66' | '67' | '68' | '69' | '70' | '71' | '72' | '73' | '74' | '75' | '76' | '77' | '78' | '79' | '80' | '81' | '82' | '83' | '84' | '85' | '86' | '87' | '88' | '89' | '90' | '91' | '92' | '93' | '94' | '95' | '96' | '97' | '98' | '99';
}

export interface S1210Data {
  evtPgtos: {
    Id?: string;
    ideEvento: IdeEvento;
    ideEmpregador: IdeEmpregador;
    ideTrabalhador: IdeTrabalhador;
    infoPgto: InfoPgto[];
  };
}

// ============================================
// S-1250 - Benefícios - FGTS
// ============================================
export interface InfoBenPrDS {
  ideBenPrDS: string;
  cnpjOrigem?: string;
  dtIniBeneficio?: string;
  vrBene?: number;
}

export interface S1250Data {
  evtBenPrDS: {
    Id?: string;
    ideEvento: IdeEvento;
    ideEmpregador: IdeEmpregador;
    ideTrabalhador: IdeTrabalhador;
    infoBenPrDS: InfoBenPrDS[];
  };
}

// ============================================
// S-1280 - Informações do FGTS
// ============================================
export interface S1280Data {
  evtInfoFGTS: {
    Id?: string;
    ideEvento: IdeEvento;
    ideEmpregador: IdeEmpregador;
    infoFGTS: {
      ideLotacao: string;
      nrRecArqBase?: string;
      dtArqBase?: string;
      dtMov: string;
      observacao?: string;
    }[];
  };
}

// ============================================
// S-1298 - Resumo de eventos do FGTS
// ============================================
export interface S1298Data {
  evtRes FGTS: {
    Id?: string;
    ideEvento: IdeEvento;
    ideEmpregador: IdeEmpregador;
    ideLotacao: string;
    resumoNfse: {
      qtdDiamdsMes: number;
      vrTotalNfse: number;
    };
  };
}

// ============================================
// S-1299 - Fechamento dos eventos do FGTS
// ============================================
export interface S1299Data {
  evtFechaEvtg: {
    Id?: string;
    ideEvento: IdeEvento;
    ideEmpregador: IdeEmpregador;
    dtFechamento: string;
    idePeriodo: {
      indApuracao: '1' | '2';  // 1=Mensal, 2=Anual
      perApur: string;  // YYYY-MM or YYYY
    };
  };
}

// ============================================
// S-2200 - Cadastramento inicial do trabalhador
// ============================================
export interface Dados Pessoais {
  cpfTrab: string;
  nisTrab?: string;
  nmTrab: string;
  novoCpf?: string;
  dtNascto: string;
  paisNascto: string;
  paisNac: string;
  email?: string;
  tramite?: string;
}

export interface Documentos {
  dtVinculo?: string;
  tipoAdm?: string;
  cnh?: string;
  dsTipoOps?: string;
}

export interface S2200Data {
  evtAdmissao: {
    Id?: string;
    ideEvento: IdeEvento;
    ideEmpregador: IdeEmpregador;
    vinculo: {
      cnh?: string;
      dtAdm: string;
      tpRegPrev?: string;
    };
  };
}

// ============================================
// Worker data from database
// ============================================
export interface TrabalhadorData {
  id: string;
  clienteId: string;
  cpf: string;
  nome: string;
  dataNascimento: Date;
  tipoRegime: string;
  ctps?: string;
  serieCtps?: string;
  ufCtps?: string;
  pis?: string;
  cnh?: string;
  email?: string;
  telefone?: string;
}

// ============================================
// Transmission result
// ============================================
export interface TransmissaoResult {
  sucesso: boolean;
  protocolo?: string;
  codigoStatus?: string;
  mensagem?: string;
  erros?: string[];
}