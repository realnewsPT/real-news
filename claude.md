# claude.md — REAL-NEWS

Contexto para qualquer sessão futura do Claude Code neste projeto. Ver
`plan.md` para o plano completo (fontes de dados, esquema, fases).

## O que é este projeto

Site estático (blog + painel de dados) que documenta, com fontes verificáveis,
polémicas/incoerências/declarações falsas de membros do CHEGA e o histórico de
votos do partido na Assembleia da República. Atualização semanal via script +
GitHub Actions. Sem backend, sem base de dados — tudo em JSON estático servido
por GitHub Pages.

## Regra editorial inegociável

**Nunca escrever, em `data/posts.json` ou em qualquer HTML, uma afirmação
factual sobre uma pessoa/entidade sem uma fonte verificável associada.** Se não
houver fonte, o item fica em `data/_candidatos.json` para revisão humana — não
é publicado. Preferir fact-checks de organizações acreditadas (Polígrafo, Lusa
Verifica) quando o rótulo for "falso"/"mentira". Ver `plan.md` secção 7.

## Stack e convenções

- HTML5 + CSS3 (Grid/Flexbox) + JS vanilla (ES modules). **Sem frameworks
  front-end** (sem React/Vue/build step) — mantém o site rápido e simples de
  manter.
- Dados vivem em `/data/*.json`; o front-end faz `fetch()` local, não há API
  em runtime.
- Scripts de recolha ficam em `/scripts/*.mjs` (Node.js, sem dependências
  pesadas — `fetch` nativo é suficiente na maioria dos casos).
- Mobile-first: escrever CSS para telemóvel primeiro, adicionar breakpoints
  (~600px, ~960px) a seguir. Testar sempre em largura pequena.
- Imagens de artigos de terceiros: **nunca copiar/hospedar localmente**. Usar
  só o `og:image` como preview com link de saída (`target="_blank"
  rel="noopener"`) para a publicação original.

## Estrutura

```
index.html          feed de polémicas (tipo blog)
votacoes.html        histórico de votos do Chega na Assembleia
sobre.html            metodologia, fontes, correções
assets/css/style.css
assets/js/{feed,votacoes,utils}.js
data/{posts,votacoes,deputados}.json
scripts/{fetch-votacoes,fetch-noticias,build-feeds}.mjs
.github/workflows/weekly-update.yml
```

## Esquemas de dados (resumo — ver plan.md 4.1/4.2 para exemplos completos)

- `votacoes.json`: um objeto por votação — `id`, `data`, `titulo`, `tipo`,
  `resultado` (Aprovado/Rejeitado), `votos` (por partido), `voto_chega`,
  `fonte_oficial`. Vem de fontes oficiais (dados abertos do parlamento /
  openAR) — **sem interpretação subjetiva**, só factos.
- `posts.json`: um objeto por caso — `data_publicacao`, `titulo` (neutro),
  `categoria`, `resumo` (factual, sem adjetivação), `pessoa`,
  `imagem_preview` (URL externo), `fonte` (nome + url obrigatórios),
  `tags`.

## Fontes de dados aprovadas

- Votações: `parlamento.pt/Cidadania/Paginas/DadosAbertos.aspx` (oficial),
  `api.openar.pt` (agregador), dataset `centraldedados/parlamento` (backup).
- Polémicas/fact-checks: `poligrafo.sapo.pt/fact-checks/`, Lusa Verifica, RSS
  de imprensa generalista (Público, Expresso, Observador, RTP, CNN Portugal,
  DN, SIC Notícias) filtrado por keyword.

Antes de adicionar uma fonte nova, confirmar que os dados são de reutilização
livre/domínio público e citar a fonte no `README`/`sobre.html`.

## Pipeline semanal

`weekly-update.yml` corre `fetch-votacoes.mjs` e `fetch-noticias.mjs`, gera
`_candidatos.json` para notícias (nunca publica automaticamente) e
`votacoes.json` pode ser atualizado automaticamente por vir de fonte oficial
estruturada. O workflow abre **Pull Request**, nunca faz commit direto em
`main` — merge é decisão humana.

## Banner/hero da homepage

`index.html` tem uma secção `.hero` com uma citação real de André Ventura
(2017, como comentador/professor, antes de fundar o Chega, criticando as fake
news) contrastada com o seu registo posterior como deputado — fonte: Polígrafo.
Qualquer citação usada num banner segue a mesma regra editorial: texto exato,
fonte verificável, contexto correto (cargo/data certos). Não voltar a assumir
que Ventura foi deputado do PSD — nunca foi; foi candidato autárquico pelo PSD
em Loures (2017) e fundou o Chega em 2019.

## O que NÃO fazer

- Não introduzir framework/build step sem necessidade clara.
- Não hospedar imagens de terceiros localmente.
- Não publicar afirmações sem fonte citada.
- Não fazer commit direto do workflow automático em `main` — sempre via PR.
- Não usar cores/identidade visual do próprio partido (evitar parecer material
  oficial do CHEGA).

## Estado atual

Projeto na fase de planeamento (ver `plan.md` secção 8, Fase 0). Ainda não há
código nem repositório git inicializado.
