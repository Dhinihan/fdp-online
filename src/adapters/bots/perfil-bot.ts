import type { GeradorAleatorio } from '@/core/RngComSeed';
import type { Jogador } from '@/types/entidades';

export const nomesBotsPorTemperatura = [
  'Brás',
  'Saci',
  'Iara',
  'Bento',
  'Narizinho',
  'Emília',
  'Quincas',
  'Capitu',
  'Bentinho',
  'Esaú',
  'Jacó',
  'Policarpo',
  'Isaías',
  'Clara',
  'Jeca',
  'Cuca',
  'Curupira',
  'Boitatá',
  'Peri',
  'Iracema',
] as const;

export interface PerfilBot {
  id: string;
  nome: string;
  temperatura: number;
}

export function nomePorTemperatura(temperatura: number): string {
  const faixa = Math.min(Math.floor(temperatura * nomesBotsPorTemperatura.length), nomesBotsPorTemperatura.length - 1);
  return nomesBotsPorTemperatura[faixa];
}

export function sortearPerfisBots(jogadores: Jogador[], rng: Pick<GeradorAleatorio, 'random'>): PerfilBot[] {
  return jogadores.filter(ehBot).map((jogador) => {
    const temperatura = rng.random();
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
