# Mega-Sena - Analise Estatistica

Aplicacao web estatica, mobile-first e instalavel como PWA para analisar historico da Mega-Sena e gerar sugestoes de jogos com exatamente 6 dezenas entre 1 e 60.

> Estatisticas historicas nao preveem sorteios, nao alteram a aleatoriedade da Mega-Sena e nao aumentam garantidamente a probabilidade matematica de premiacao.

## Funcionalidades

- Painel com ultimo concurso, data do sorteio, total de concursos, dezenas sorteadas e data deterministica de atualizacao do XLSX.
- Frequencia, percentual, atraso atual, ultimo concurso e maior atraso historico por dezena.
- Janelas de analise para ultimos 50, 100, 500 ou todos os concursos.
- Distribuicoes de pares/impares, baixas/altas, soma, faixas de 01-10 a 51-60, sequencias consecutivas e repeticao contra o concurso anterior.
- Gerador de cinco jogos distintos com criterios configuraveis no codigo: frequencia, atraso, paridade, baixas/altas, soma, faixas, sequencias e repeticao.
- Copia individual de cada jogo e copia de todos os jogos.
- Backtest que corta a base antes do concurso alvo e aceita semente deterministica.
- PWA com manifesto, icones versionados, service worker e cache offline apos o primeiro acesso.

## Dados

A fonte oficial da base e a pagina da CAIXA:

https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx

Coloque o XLSX oficial em:

```bash
public/data/megasena.xlsx
```

O arquivo anexado nesta conversa nao ficou disponivel no workspace; por isso o repositorio esta preparado para receber `megasena.xlsx`, mas nao inclui dados oficiais gerados.

## Atualizacao Manual

1. Baixe o XLSX atualizado na pagina oficial da CAIXA.
2. Substitua `public/data/megasena.xlsx` mantendo esse nome.
3. Rode `npm run data:build`.
4. Rode os testes, lint e build.
5. Publique via push para `main`.

O app nao usa APIs, backend, banco de dados ou servicos pagos. Os arquivos `public/data/results.json` e `public/data/metadata.json` sao gerados durante o build a partir do XLSX.

## Data De Atualizacao

`metadata.sourceUpdatedAt` e determinado no build nesta ordem:

- valor de `SOURCE_UPDATED_AT`, usado pela Action com `git log`;
- data do ultimo commit que alterou `public/data/megasena.xlsx`;
- `mtime` do arquivo, apenas quando metadados Git nao estiverem disponiveis.

Assim a interface nao depende da data atual do navegador.

## Desenvolvimento

Requer Node.js 22 ou versao compativel.

```bash
npm ci
npm run data:build
npm run dev
```

Validacao completa:

```bash
npm test
npm run lint
npm run build
```

Para testar o caminho do GitHub Pages localmente:

```bash
VITE_BASE_PATH=/megasena/ npm run build
npm run preview
```

O repositorio configurado e `https://github.com/neybarao/megasena`, entao o `base` padrao do Vite e `/megasena/`. Se o nome do repositorio mudar, ajuste `VITE_BASE_PATH` no build ou altere o `base` padrao em `vite.config.ts`.

## Deploy No GitHub Pages

O workflow esta em `.github/workflows/deploy-pages.yml` e roda em push para `main` ou manualmente por `workflow_dispatch`.

No GitHub, configure Pages para usar **GitHub Actions** como fonte de publicacao. Nao ha `CNAME`; adicione dominio customizado somente quando o dominio final for definido.

## PWA

Os icones placeholder ficam em `public/icons/icon-192-v1.png` e `public/icons/icon-512-v1.png`. Quando trocar por um icone final, use nomes versionados novos, por exemplo `icon-192-v2.png`, e atualize `index.html`, `manifest.webmanifest` e `sw.js`, porque o iOS pode manter icones antigos em cache.
