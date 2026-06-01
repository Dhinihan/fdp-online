import type { GeradorAleatorio } from '@/core/RngComSeed';
import type { Jogador } from '@/types/entidades';

export const nomesBotsPorTemperatura = [
  'Brás', // Brás Cubas — Memórias Póstumas de Brás Cubas (Machado de Assis)
  'Severino', // Morte e Vida Severina (João Cabral de Melo Neto)
  'Iara', // Iara — lenda do folclore brasileiro
  'Bento', // Bento Santiago — D. Casmurro (Machado de Assis)
  'Ana', // Ana Terra — O Tempo e o Vento (Érico Veríssimo)
  'Pedro', // Pedro Bala — Capitães da Areia (Jorge Amado)
  'Vitória', // Sinhá Vitória — Vidas Secas (Graciliano Ramos)
  'Augusto', // Augusto Matraga — Sagarana (Guimarães Rosa)
  'Leonardo', // Leonardo — Memórias de um Sargento de Milícias (Manuel Antônio de Almeida)
  'Fabiano', // Fabiano — Vidas Secas (Graciliano Ramos)
  'Sofia', // Sofia — Quincas Borba (Machado de Assis)
  'Luís', // Luís da Silva — Angústia (Graciliano Ramos)
  'Aurélia', // Aurélia Camargo — Senhora (José de Alencar)
  'Clara', // Clara dos Anjos — Clara dos Anjos (Lima Barreto)
  'Rita', // Rita Baiana — O Cortiço (Aluísio Azevedo)
  'Sérgio', // narrador de O Ateneu (Raul Pompeia)
  'Paulo', // Paulo Honório — São Bernardo (Graciliano Ramos)
  'Flor', // Dona Flor — Dona Flor e Seus Dois Maridos (Jorge Amado)
  'Jerônimo', // Jerônimo — O Cortiço (Aluísio Azevedo)
  'Iracema', // Iracema — Iracema (José de Alencar)
] as const;

export interface PerfilBot {
  id: string;
  nome: string;
  temperatura: number;
}

const totalFaixas = nomesBotsPorTemperatura.length;
const larguraFaixa = 1 / totalFaixas;

export function nomePorTemperatura(temperatura: number): string {
  const faixa = Math.min(Math.floor(temperatura * totalFaixas), totalFaixas - 1);
  return nomesBotsPorTemperatura[faixa];
}

export function sortearPerfisBots(
  jogadores: Jogador[],
  rng: Pick<GeradorAleatorio, 'random' | 'shuffle'>,
): PerfilBot[] {
  const bots = jogadores.filter(ehBot);
  const faixas = rng.shuffle(Array.from({ length: totalFaixas }, (_, indice) => indice)).slice(0, bots.length);

  return bots.map((jogador, indice) => {
    const temperatura = (faixas[indice] + rng.random()) * larguraFaixa;
    return {
      id: jogador.id,
      nome: nomePorTemperatura(temperatura),
      temperatura,
    };
  });
}

export function aplicarPerfisBots(jogadores: Jogador[], perfis: PerfilBot[]): Jogador[] {
  return jogadores.map((jogador) => {
    const perfil = perfis.find((item) => item.id === jogador.id);
    if (!perfil) return jogador;
    return { ...jogador, nome: perfil.nome, temperatura: perfil.temperatura };
  });
}

function ehBot(jogador: Jogador): boolean {
  return jogador.id.startsWith('bot');
}
