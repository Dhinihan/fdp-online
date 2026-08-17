import { describe, expect, it } from 'vitest';
import { arquivosDoServiceWorker, arquivosForaDoPrecache, extrairUrlsDePrecache } from '../../scripts/precache.ts';

describe('extrairUrlsDePrecache', () => {
  it('deve extrair as urls da chamada de precacheAndRoute', () => {
    const sw = `precacheAndRoute([{url:"index.html",revision:"abc"},{url:"assets/index-KOcrgI4E.js",revision:null}],{ignoreURLParametersMatching:[/^debug$/]})`;

    expect(extrairUrlsDePrecache(sw)).toEqual(['index.html', 'assets/index-KOcrgI4E.js']);
  });

  it('deve falhar quando o sw não tem manifesto de precache', () => {
    expect(() => extrairUrlsDePrecache('console.log("sem precache")')).toThrow(/manifesto de precache/);
  });
});

describe('arquivosDoServiceWorker', () => {
  it('deve incluir o sw.js e o runtime declarado no define do workbox', () => {
    const sw = `define(["./workbox-2fbc6a65"],function(e){"use strict"})`;

    expect(arquivosDoServiceWorker(sw)).toEqual(['sw.js', 'workbox-2fbc6a65.js']);
  });

  it('deve incluir o runtime carregado por importScripts', () => {
    const sw = `importScripts("workbox-2fbc6a65.js")`;

    expect(arquivosDoServiceWorker(sw)).toEqual(['sw.js', 'workbox-2fbc6a65.js']);
  });

  it('deve retornar só o sw.js quando ele não carrega runtime externo', () => {
    expect(arquivosDoServiceWorker('precacheAndRoute([])')).toEqual(['sw.js']);
  });
});

describe('arquivosForaDoPrecache', () => {
  it('deve retornar vazio quando todo arquivo do dist está no precache', () => {
    const arquivos = ['index.html', 'assets/index-KOcrgI4E.js', 'sfx/ui-click.mp3'];

    expect(arquivosForaDoPrecache(arquivos, arquivos, ['sw.js'])).toEqual([]);
  });

  it('deve apontar o arquivo do dist que ficou fora do precache', () => {
    const arquivos = ['index.html', 'sfx/ui-click.mp3'];

    expect(arquivosForaDoPrecache(arquivos, ['index.html'], ['sw.js'])).toEqual(['sfx/ui-click.mp3']);
  });

  it('deve ignorar só o service worker e o runtime que ele mesmo declara', () => {
    const arquivos = ['index.html', 'sw.js', 'workbox-2fbc6a65.js'];

    expect(arquivosForaDoPrecache(arquivos, ['index.html'], ['sw.js', 'workbox-2fbc6a65.js'])).toEqual([]);
  });

  it('deve cobrar um arquivo com cara de workbox que o sw.js não declara', () => {
    const arquivos = ['workbox-config.js'];

    expect(arquivosForaDoPrecache(arquivos, [], ['sw.js', 'workbox-2fbc6a65.js'])).toEqual(['workbox-config.js']);
  });

  it('não deve ignorar favicon.svg nem icons.svg', () => {
    const arquivos = ['favicon.svg', 'icons.svg'];

    expect(arquivosForaDoPrecache(arquivos, [], ['sw.js'])).toEqual(['favicon.svg', 'icons.svg']);
  });
});
