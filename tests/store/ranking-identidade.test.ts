import { describe, expect, it } from 'vitest';
import { identidadeDe } from '@/store/ranking/identidade';
import type { Jogador } from '@/types/entidades';

function jogador(id: string, nome: string): Jogador {
  return { id, nome, pontos: 0 };
}

describe('identidadeDe', () => {
  it('mapeia o jogador humano para a chave "humano" exibindo "Você"', () => {
    expect(identidadeDe(jogador('humano', 'Você'))).toEqual({ chave: 'humano', nomeExibicao: 'Você' });
  });

  it('deriva slug ASCII do nome do Perfil de Bot, removendo acentos', () => {
    expect(identidadeDe(jogador('bot1', 'Brás'))).toEqual({ chave: 'bot:bras', nomeExibicao: 'Brás' });
    expect(identidadeDe(jogador('bot2', 'Vitória'))).toEqual({ chave: 'bot:vitoria', nomeExibicao: 'Vitória' });
    expect(identidadeDe(jogador('bot3', 'Luís'))).toEqual({ chave: 'bot:luis', nomeExibicao: 'Luís' });
  });

  it('usa o nome do Perfil de Bot, não o assento técnico bot1/bot2/bot3', () => {
    expect(identidadeDe(jogador('bot1', 'Iara')).chave).toBe('bot:iara');
  });
});
