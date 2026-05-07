interface PontuacaoConfig {
  declaracoes: Record<string, number>;
  vazas: Record<string, number>;
  pontosAtuais: Record<string, number>;
  jogadoresIds: string[];
}

export interface ResultadoPontuacao {
  pontos: Record<string, number>;
  penalidades: Record<string, number>;
}

interface EstadoPontuavel {
  declaracoes: Record<string, number>;
  vazas: Record<string, number>;
  pontos: Record<string, number>;
}

export function calcularPontuacao(config: PontuacaoConfig): ResultadoPontuacao {
  const pontos: Record<string, number> = {};
  const penalidades: Record<string, number> = {};

  for (const jogadorId of config.jogadoresIds) {
    const declarado = config.declaracoes[jogadorId] ?? 0;
    const feito = config.vazas[jogadorId] ?? 0;
    const penalidade = Math.abs(declarado - feito);
    penalidades[jogadorId] = penalidade;
    pontos[jogadorId] = (config.pontosAtuais[jogadorId] ?? 5) - penalidade;
  }

  return { pontos, penalidades };
}

export function aplicarPontuacao(estado: EstadoPontuavel, jogadoresIds: string[]): ResultadoPontuacao {
  const resultado = calcularPontuacao({
    declaracoes: estado.declaracoes,
    vazas: estado.vazas,
    pontosAtuais: estado.pontos,
    jogadoresIds,
  });
  estado.pontos = resultado.pontos;
  return resultado;
}
