const STATUS_VALIDOS = ['pronto', 'executando', 'aguardando_retry', 'pr_aberta', 'bloqueado', 'concluido'] as const;

const CHAVES_YAML = [
  'status',
  'tentativas_usadas',
  'cooldown_ate',
  'ultima_execucao_em',
  'ultimo_resultado',
  'branch',
  'pr_numero',
] as const;

type StatusOperacionalIssue = (typeof STATUS_VALIDOS)[number];

export interface EstadoOperacionalIssueYaml {
  status: StatusOperacionalIssue;
  tentativasUsadas: number;
  cooldownAte: string | null;
  ultimaExecucaoEm: string | null;
  ultimoResultado: string | null;
  branch: string | null;
  prNumero: number | null;
}

export function renderizarEstadoYaml(estado: EstadoOperacionalIssueYaml): string {
  return [
    `status: ${serializarValorYaml(estado.status)}`,
    `tentativas_usadas: ${String(estado.tentativasUsadas)}`,
    `cooldown_ate: ${serializarValorYaml(estado.cooldownAte)}`,
    `ultima_execucao_em: ${serializarValorYaml(estado.ultimaExecucaoEm)}`,
    `ultimo_resultado: ${serializarValorYaml(estado.ultimoResultado)}`,
    `branch: ${serializarValorYaml(estado.branch)}`,
    `pr_numero: ${serializarValorYaml(estado.prNumero)}`,
  ].join('\n');
}

export function parsearEstadoYaml(yaml: string): EstadoOperacionalIssueYaml | null {
  const valores = lerChavesYaml(yaml);

  if (!valores) {
    return null;
  }

  return montarEstadoOperacional(valores);
}

function serializarValorYaml(valor: number | string | null): string {
  if (valor === null) {
    return 'null';
  }

  if (typeof valor === 'number') {
    return String(valor);
  }

  return JSON.stringify(valor);
}

function lerChavesYaml(yaml: string): Record<(typeof CHAVES_YAML)[number], string> | null {
  const linhas = yaml.trim().split('\n');
  const valoresParciais: Partial<Record<(typeof CHAVES_YAML)[number], string>> = {};

  for (const linha of linhas) {
    const chaveValor = parsearLinhaYaml(linha);

    if (!chaveValor) {
      return null;
    }

    const [chave, valor] = chaveValor;
    valoresParciais[chave] = valor;
  }

  if (!possuiTodasAsChaves(valoresParciais)) {
    return null;
  }

  return valoresParciais;
}

function parsearLinhaYaml(linha: string): [(typeof CHAVES_YAML)[number], string] | null {
  const separador = linha.indexOf(':');

  if (separador <= 0) {
    return null;
  }

  const chave = linha.slice(0, separador).trim();
  const valor = linha.slice(separador + 1).trim();

  if (!isChaveYamlValida(chave)) {
    return null;
  }

  return [chave, valor];
}

function isChaveYamlValida(chave: string): chave is (typeof CHAVES_YAML)[number] {
  return CHAVES_YAML.includes(chave as (typeof CHAVES_YAML)[number]);
}

function possuiTodasAsChaves(
  valores: Partial<Record<(typeof CHAVES_YAML)[number], string>>,
): valores is Record<(typeof CHAVES_YAML)[number], string> {
  return CHAVES_YAML.every((chave) => valores[chave] !== undefined);
}

function montarEstadoOperacional(
  valores: Record<(typeof CHAVES_YAML)[number], string>,
): EstadoOperacionalIssueYaml | null {
  const status = parsearStatusOperacional(valores.status);
  const tentativasUsadas = parsearNumeroInteiro(valores.tentativas_usadas);
  const prNumero = parsearNumeroOpcional(valores.pr_numero);

  if (!status || tentativasUsadas === null || prNumero === undefined) {
    return null;
  }

  return {
    status,
    tentativasUsadas,
    cooldownAte: parsearTextoOpcional(valores.cooldown_ate),
    ultimaExecucaoEm: parsearTextoOpcional(valores.ultima_execucao_em),
    ultimoResultado: parsearTextoOpcional(valores.ultimo_resultado),
    branch: parsearTextoOpcional(valores.branch),
    prNumero,
  };
}

function parsearStatusOperacional(valor: string): StatusOperacionalIssue | null {
  const texto = parsearTextoOpcional(valor);

  if (!texto || !STATUS_VALIDOS.includes(texto as StatusOperacionalIssue)) {
    return null;
  }

  return texto as StatusOperacionalIssue;
}

function parsearNumeroInteiro(valor: string): number | null {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 0) {
    return null;
  }

  return numero;
}

function parsearNumeroOpcional(valor: string): number | null | undefined {
  const texto = parsearTextoOpcional(valor);

  if (texto === null) {
    return null;
  }

  return parsearNumeroInteiro(texto) ?? undefined;
}

function parsearTextoOpcional(valor: string): string | null {
  if (valor === 'null') {
    return null;
  }

  if (valor.startsWith('"') && valor.endsWith('"')) {
    return JSON.parse(valor) as string;
  }

  return valor || null;
}
