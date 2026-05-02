export interface ResultadoBlockedByValido {
  status: 'valido';
  dependencias: number[];
}

export interface ResultadoBlockedByInvalido {
  status: 'invalido';
  motivo: string;
}

export type ResultadoBlockedBy = ResultadoBlockedByValido | ResultadoBlockedByInvalido;

const REGEX_SECAO_BLOCKED_BY = /^## Blocked by\s*$/gm;
const REGEX_CABECALHO_SECAO = /^##\s+/gm;
const REGEX_LINHA_REFERENCIA_ISSUE = /^(?:[-*]\s*)?#(\d+)\s*$/;
const REGEX_REFERENCIA_PR_TEXTO = /\bpr\s*#\d+\b|\bpull request\b|\/pull\/\d+/i;

export function analisarBlockedBy(corpo: string): ResultadoBlockedBy {
  const secao = lerSecaoBlockedBy(corpo);

  if (secao.status === 'invalido') {
    return secao;
  }

  if (REGEX_REFERENCIA_PR_TEXTO.test(secao.conteudo)) {
    return invalido('secao `## Blocked by` referencia PR em vez de issue');
  }

  return extrairDependencias(secao.conteudo);
}

function extrairConteudoSecao(corpo: string, indiceSecao: number, tamanhoCabecalho: number): string {
  const inicioConteudo = indiceSecao + tamanhoCabecalho;
  const resto = corpo.slice(inicioConteudo);
  const correspondenciaProximaSecao = REGEX_CABECALHO_SECAO.exec(resto);

  REGEX_CABECALHO_SECAO.lastIndex = 0;

  if (!correspondenciaProximaSecao) {
    return resto;
  }

  return resto.slice(0, correspondenciaProximaSecao.index);
}

function lerSecaoBlockedBy(corpo: string): { status: 'valido'; conteudo: string } | ResultadoBlockedByInvalido {
  const secoes = [...corpo.matchAll(REGEX_SECAO_BLOCKED_BY)];

  if (secoes.length === 0) {
    return invalido('secao `## Blocked by` ausente');
  }

  if (secoes.length > 1) {
    return invalido('secao `## Blocked by` duplicada');
  }

  const secao = extrairConteudoSecao(corpo, secoes[0].index, secoes[0][0].length).trim();

  if (!secao) {
    return invalido('secao `## Blocked by` vazia');
  }

  return {
    status: 'valido',
    conteudo: secao,
  };
}

function extrairDependencias(secao: string): ResultadoBlockedBy {
  const linhas = secao
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean);
  const dependencias = new Set<number>();

  for (const linha of linhas) {
    const resultado = extrairReferenciasLinha(linha);

    if (resultado.status === 'invalido') {
      return resultado;
    }

    for (const referencia of resultado.dependencias) {
      dependencias.add(referencia);
    }
  }

  return { status: 'valido', dependencias: [...dependencias] };
}

function extrairReferenciasLinha(linha: string): ResultadoBlockedBy {
  const correspondencia = linha.match(REGEX_LINHA_REFERENCIA_ISSUE);

  if (!correspondencia) {
    return invalido('secao `## Blocked by` contem linha ilegivel sem referencia `#123`');
  }

  return { status: 'valido', dependencias: [Number(correspondencia[1])] };
}

function invalido(motivo: string): ResultadoBlockedByInvalido {
  return {
    status: 'invalido',
    motivo,
  };
}
