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
- Linguagem visual: tema escuro/claro automático (`prefers-color-scheme`),
  azul moderno (`--accent`) + azul-petróleo (`--accent-2`) em gradiente,
  fundo com dois "blobs" radiais decorativos (`body::before/::after`),
  cartões em vidro fosco (`backdrop-filter: blur`), títulos em serifada
  (`--font-serif`, ex. Georgia) para um ar mais editorial/humano, corpo em
  sans-serif. Cartões do feed têm numeração ("01", "02"...) sobre a imagem.
  Categorias usam a classe `.tag` (ponto colorido + texto), **nunca** um
  badge maiúsculo tipo "FACT-CHECK" — isso foi pedido explicitamente para
  evitar um ar "robotizado"/gerado por template.

## Estrutura

```
index.html          feed de polémicas (tipo blog)
votacoes.html        votações do Chega, em linha do tempo cronológica
opiniao.html          artigo de opinião assinado (A.M.) — ver regra abaixo
sobre.html            metodologia, fontes, correções
assets/css/style.css
assets/js/{feed,votacoes,utils}.js
data/{posts,votacoes,deputados}.json
scripts/{fetch-votacoes,fetch-noticias,build-feeds,dev-server}.mjs  (dev-server.mjs = servidor local p/ testar sem Python)
.github/workflows/weekly-update.yml
```

## Esquemas de dados (resumo — ver plan.md 4.1/4.2 para exemplos completos)

- `votacoes.json`: um objeto por votação — `id`, `data`, `titulo`, `tipo`,
  `resultado` (Aprovado/Rejeitado), `votos` (por partido), `voto_chega`,
  `fonte_oficial`. Vem de fontes oficiais (dados abertos do parlamento /
  openAR / grelhas oficiais de votação / notícias que reportam o resultado
  oficial) — **sem interpretação subjetiva**, só factos. Ficheiro guardado por
  ordem descendente (mais recente primeiro), mas `votacoes.js` reordena para
  **cronológica ascendente** ao renderizar a linha do tempo.
  - `voto_simbolico` (boolean): `true` quando, no momento da votação, o
    resultado já estava matematicamente decidido por outros partidos —
    o voto do Chega não podia, por si só, mudar o desfecho. Critério
    objetivo (contagem de votos), não estético. Quando `true`, incluir
    `motivo_simbolico` (string) a explicar a conta. Renderizado como aviso
    "⚠ Voto sem custo político" no `vote-card`.
- `posts.json`: um objeto por caso — `data_publicacao`, `titulo` (neutro),
  `categoria`, `resumo` (factual, sem adjetivação), `pessoa`,
  `imagem_preview` (URL externo), `fonte` (nome + url obrigatórios),
  `tags`. Categorias em uso: "Fact-check", "Incoerência de voto",
  "Incoerência de discurso", "Voto sem custo político" — usadas em `feed.js`
  como etiqueta discreta (ponto colorido + texto em caixa normal), não como
  badge maiúsculo/gritado.

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

## Página de Opinião (opiniao.html)

Ao contrário de `index.html`/`votacoes.html` (factuais, sem interpretação),
`opiniao.html` é um artigo de comentário assinado ("A.M.") com tom forte e
argumentativo — é o único sítio do site onde isso é aceitável. Mesmo assim:
- Continua identificado como **opinião**, visual e textualmente (badge
  "Opinião", disclaimer explícito, `sobre.html` explica a distinção).
- Cada facto usado no texto (citações, votos, número de mentiras assinaladas)
  tem de estar já documentado com fonte em `posts.json`/`votacoes.json`, ou
  linkar diretamente para a fonte externa — o tom pode ser duro, os factos não
  podem ser inventados ou esticados além do que a fonte diz.
- Atualizar este artigo quando surgirem novos casos relevantes documentados
  nas outras secções, mantendo a mesma disciplina de sourcing.

## O que NÃO fazer

- Não introduzir framework/build step sem necessidade clara.
- Não hospedar imagens de terceiros localmente.
- Não publicar afirmações sem fonte citada.
- Não fazer commit direto do workflow automático em `main` — sempre via PR.
- ~~Não usar cores/identidade visual do próprio partido~~ — **revogado
  2026-07-20 por pedido explícito do utilizador**: a paleta (`--accent`,
  `--accent-2`, `--accent-3` em `assets/css/style.css`) foi atualizada para
  tons vermelho-alaranjado/índigo próximos do logotipo do Chega,
  propositadamente. Não reverter para a paleta azul/petróleo original sem
  confirmar com o utilizador.

## Estado atual

Site publicado e ao vivo em GitHub Pages (repositório `realnewsPT/real-news`,
branch `main`). Deploy é automático a cada `git push` para `main` (~1 min).
A automação semanal via GitHub Actions ainda não teve as permissões de
Actions confirmadas pelo utilizador (passo pendente: Settings → Actions →
General → Workflow permissions → Read and write). Até lá, atualizações de
dados são feitas manualmente por sessões do Claude Code: editar
`data/posts.json`/`data/votacoes.json`, correr
`node scripts/build-feeds.mjs` para validar, e `git add`/`commit`/`push`.
