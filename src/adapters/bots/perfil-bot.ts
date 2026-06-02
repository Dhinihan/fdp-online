import type { GeradorAleatorio } from '@/core/RngComSeed';
import type { Jogador } from '@/types/entidades';

/**
 * Fonte canônica dos Perfis de Bot. Cada perfil tem um `id` estável — a
 * identidade reconhecível usada no Ranking entre Partidas — desacoplado do
 * `nome` exibido: renomear o texto não muda o `id`, e dois perfis nunca
 * compartilham `id` (lista fechada e curada à mão, sem slug derivado de nome).
 */
export const perfisBotsPorTemperatura = [
  { id: 'bras', nome: 'Brás' }, // Brás Cubas — Memórias Póstumas de Brás Cubas (Machado de Assis)
  { id: 'severino', nome: 'Severino' }, // Morte e Vida Severina (João Cabral de Melo Neto)
  { id: 'iara', nome: 'Iara' }, // Iara — lenda do folclore brasileiro
  { id: 'bento', nome: 'Bento' }, // Bento Santiago — D. Casmurro (Machado de Assis)
  { id: 'ana', nome: 'Ana' }, // Ana Terra — O Tempo e o Vento (Érico Veríssimo)
  { id: 'pedro', nome: 'Pedro' }, // Pedro Bala — Capitães da Areia (Jorge Amado)
  { id: 'vitoria', nome: 'Vitória' }, // Sinhá Vitória — Vidas Secas (Graciliano Ramos)
  { id: 'augusto', nome: 'Augusto' }, // Augusto Matraga — Sagarana (Guimarães Rosa)
  { id: 'leonardo', nome: 'Leonardo' }, // Leonardo — Memórias de um Sargento de Milícias (Manuel Antônio de Almeida)
  { id: 'fabiano', nome: 'Fabiano' }, // Fabiano — Vidas Secas (Graciliano Ramos)
  { id: 'sofia', nome: 'Sofia' }, // Sofia — Quincas Borba (Machado de Assis)
  { id: 'luis', nome: 'Luís' }, // Luís da Silva — Angústia (Graciliano Ramos)
  { id: 'aurelia', nome: 'Aurélia' }, // Aurélia Camargo — Senhora (José de Alencar)
  { id: 'clara', nome: 'Clara' }, // Clara dos Anjos — Clara dos Anjos (Lima Barreto)
  { id: 'rita', nome: 'Rita' }, // Rita Baiana — O Cortiço (Aluísio Azevedo)
  { id: 'sergio', nome: 'Sérgio' }, // narrador de O Ateneu (Raul Pompeia)
  { id: 'paulo', nome: 'Paulo' }, // Paulo Honório — São Bernardo (Graciliano Ramos)
  { id: 'flor', nome: 'Flor' }, // Dona Flor — Dona Flor e Seus Dois Maridos (Jorge Amado)
  { id: 'jeronimo', nome: 'Jerônimo' }, // Jerônimo — O Cortiço (Aluísio Azevedo)
  { id: 'iracema', nome: 'Iracema' }, // Iracema — Iracema (José de Alencar)
] as const;

export const nomesBotsPorTemperatura = perfisBotsPorTemperatura.map((perfil) => perfil.nome);

export interface PerfilBot {
  id: string;
  perfilId: string;
  nome: string;
  temperatura: number;
}

const totalFaixas = perfisBotsPorTemperatura.length;
const larguraFaixa = 1 / totalFaixas;

export function perfilPorTemperatura(temperatura: number): { id: string; nome: string } {
  const faixa = Math.min(Math.floor(temperatura * totalFaixas), totalFaixas - 1);
  return perfisBotsPorTemperatura[faixa];
}

export function nomePorTemperatura(temperatura: number): string {
  return perfilPorTemperatura(temperatura).nome;
}

export function sortearPerfisBots(
  jogadores: Jogador[],
  rng: Pick<GeradorAleatorio, 'random' | 'shuffle'>,
): PerfilBot[] {
  const bots = jogadores.filter(ehBot);
  const faixas = rng.shuffle(Array.from({ length: totalFaixas }, (_, indice) => indice)).slice(0, bots.length);

  return bots.map((jogador, indice) => {
    const temperatura = (faixas[indice] + rng.random()) * larguraFaixa;
    const perfil = perfilPorTemperatura(temperatura);
    return {
      id: jogador.id,
      perfilId: perfil.id,
      nome: perfil.nome,
      temperatura,
    };
  });
}

export function aplicarPerfisBots(jogadores: Jogador[], perfis: PerfilBot[]): Jogador[] {
  return jogadores.map((jogador) => {
    const perfil = perfis.find((item) => item.id === jogador.id);
    if (!perfil) return jogador;
    return { ...jogador, perfilId: perfil.perfilId, nome: perfil.nome, temperatura: perfil.temperatura };
  });
}

function ehBot(jogador: Jogador): boolean {
  return jogador.id.startsWith('bot');
}
