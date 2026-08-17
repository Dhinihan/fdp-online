import { describe, expect, it } from 'vitest';
import { arquivosForaDoPrecache, extrairUrlsDePrecache } from '../../scripts/precache.ts';

describe('extrairUrlsDePrecache', () => {
  it('deve extrair as urls da chamada de precacheAndRoute', () => {
    const sw = `precacheAndRoute([{url:"index.html",revision:"abc"},{url:"assets/index-KOcrgI4E.js",revision:null}],{ignoreURLParametersMatching:[/^debug$/]})`;

    expect(extrairUrlsDePrecache(sw)).toEqual(['index.html', 'assets/index-KOcrgI4E.js']);
  });

  it('deve falhar quando o sw não tem manifesto de precache', () => {
    expect(() => extrairUrlsDePrecache('console.log("sem precache")')).toThrow(/manifesto de precache/);
  });
});

describe('arquivosForaDoPrecache', () => {
  it('deve retornar vazio quando todo arquivo do dist está no precache', () => {
    const arquivos = ['index.html', 'assets/index-KOcrgI4E.js', 'sfx/ui-click.mp3'];

    expect(arquivosForaDoPrecache(arquivos, arquivos)).toEqual([]);
  });

  it('deve apontar o arquivo do dist que ficou fora do precache', () => {
    const arquivos = ['index.html', 'sfx/ui-click.mp3'];

    expect(arquivosForaDoPrecache(arquivos, ['index.html'])).toEqual(['sfx/ui-click.mp3']);
  });

  it('deve ignorar o próprio service worker e o runtime do workbox', () => {
    const arquivos = ['index.html', 'sw.js', 'workbox-2fbc6a65.js'];

    expect(arquivosForaDoPrecache(arquivos, ['index.html'])).toEqual([]);
  });

  it('não deve ignorar favicon.svg nem icons.svg', () => {
    const arquivos = ['favicon.svg', 'icons.svg'];

    expect(arquivosForaDoPrecache(arquivos, [])).toEqual(['favicon.svg', 'icons.svg']);
  });
});
