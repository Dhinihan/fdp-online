import { describe, expect, it } from 'vitest';
import { identidadeDe } from '@/store/ranking/identidade';
import type { Jogador } from '@/types/entidades';

function jogador(id: string, nome: string, perfilId?: string): Jogador {
  return { id, nome, pontos: 0, perfilId };
}

describe('identidadeDe', () => {
  it('mapeia o jogador humano para a chave "humano" exibindo "Você"', () => {
    expect(identidadeDe(jogador('humano', 'Você'))).toEqual({ chave: 'humano', nomeExibicao: 'Você' });
  });

  it('ancora a chave do Perfil de Bot no perfilId canônico, não no nome exibido', () => {
    expect(identidadeDe(jogador('bot1', 'Brás', 'bras'))).toEqual({ chave: 'bot:bras', nomeExibicao: 'Brás' });
    expect(identidadeDe(jogador('bot2', 'Vitória', 'vitoria'))).toEqual({
      chave: 'bot:vitoria',
      nomeExibicao: 'Vitória',
    });
  });

  it('mantém a chave estável quando o nome exibido muda (mesmo perfilId)', () => {
    expect(identidadeDe(jogador('bot1', 'Brás', 'bras')).chave).toBe('bot:bras');
    expect(identidadeDe(jogador('bot3', 'Brás Cubas', 'bras')).chave).toBe('bot:bras');
  });

  it('usa o perfilId, não o assento técnico bot1/bot2/bot3', () => {
    expect(identidadeDe(jogador('bot1', 'Iara', 'iara')).chave).toBe('bot:iara');
    expect(identidadeDe(jogador('bot3', 'Iara', 'iara')).chave).toBe('bot:iara');
  });

  it('dá precedência ao humano mesmo que carregue um perfilId espúrio', () => {
    expect(identidadeDe(jogador('humano', 'Você', 'bras'))).toEqual({ chave: 'humano', nomeExibicao: 'Você' });
  });

  it('não trata um participante não-humano sem perfilId como bot — lança erro explícito', () => {
    expect(() => identidadeDe(jogador('observador', 'Fantasma'))).toThrow(/identidade de Ranking/);
  });

  it('rejeita perfilId vazio em vez de gerar a chave degenerada "bot:"', () => {
    expect(() => identidadeDe(jogador('bot1', 'Sem perfil', ''))).toThrow(/identidade de Ranking/);
  });
});
