# Plano — REAL-NEWS

Página estilo blog/observatório sobre incoerências, polémicas, declarações falsas e
dramas do partido CHEGA, com uma secção dedicada ao registo de votações na
Assembleia da República. Site estático, atualizado semanalmente, otimizado para
telemóvel e portátil.

> **Nota editorial (ler antes de implementar):** este projeto publica críticas
> factuais a um partido político e aos seus representantes eleitos — um uso
> legítimo de jornalismo cívico/accountability, desde que **cada entrada tenha
> fonte verificável**. Não inventamos factos, não afirmamos nada que a fonte
> citada não afirme, e distinguimos claramente "facto reportado por X" de
> opinião. Ver secção 7 (Risco legal e editorial).

---

## 1. Objetivo

- Agregar, de forma clara e visual, notícias e fact-checks sobre polémicas,
  contradições e declarações falsas de membros do CHEGA.
- Mostrar o histórico de voto do CHEGA na Assembleia da República (a favor /
  contra / abstenção) e o resultado de cada votação (aprovado/rejeitado),
  para evidenciar padrões de coerência/incoerência entre discurso e voto.
- Manter-se atualizado semanalmente com o mínimo de esforço manual.
- Ser rápido, simples, legível em qualquer ecrã.

## 2. Stack (simples e eficiente)

Sem framework de front-end — um site estático clássico é suficiente para este
volume de conteúdo e maximiza performance, simplicidade e facilidade de hosting
gratuito.

| Camada | Escolha | Porquê |
|---|---|---|
| Front-end | HTML5 + CSS3 (Grid/Flexbox) + JS vanilla (ES modules) | Zero build step, carregamento instantâneo, fácil de manter |
| Dados | Ficheiros JSON estáticos (`/data/posts.json`, `/data/votacoes.json`) | O front-end faz `fetch()` e renderiza — sem backend/DB |
| Atualização de dados | Scripts Node.js em `/scripts` correm via GitHub Actions (cron semanal) | Gera/atualiza os JSON automaticamente, sem servidor próprio |
| Hosting | GitHub Pages (ou Netlify/Cloudflare Pages, grátis) | Deploy automático a cada push |
| Imagens | Não se copiam imagens de terceiros — usa-se `og:image` do artigo original como thumbnail em pré-visualização (miniatura tipo "link preview"), com clique a abrir a publicação original numa nova aba | Evita violação de direitos de autor; a miniatura de preview é uso justo consolidado (idêntico ao preview que WhatsApp/Facebook/Twitter geram) |
| Pesquisa/filtros | JS vanilla (filtro por categoria, data, deputado) | Sem dependências externas |

Bibliotecas externas: **nenhuma obrigatória**. Opcional, se necessário mais
tarde: `lite-youtube-embed`-style leveza para vídeo incorporado, ou `Fuse.js`
(via CDN) só se a pesquisa de texto livre se tornar necessária. Evitar React/Vue
— não há necessidade de estado complexo.

## 3. Estrutura de ficheiros

```
/
├── index.html                 # Página inicial — feed de posts (blog)
├── votacoes.html               # Página "Como vota o Chega"
├── sobre.html                  # Metodologia, fontes, critério editorial, contacto/correção
├── /assets
│   ├── /css/style.css          # Design system, responsivo (mobile-first)
│   └── /js
│       ├── feed.js              # Render do feed de posts + filtros
│       ├── votacoes.js          # Render da tabela/lista de votações + filtros
│       └── utils.js             # Helpers (datas, fetch, paginação)
├── /data
│   ├── posts.json               # Entradas do "blog" (polémicas/incoerências)
│   ├── votacoes.json            # Registo de votações do CHEGA
│   └── deputados.json           # (opcional) mapa deputado → mandato ativo
├── /scripts
│   ├── fetch-votacoes.mjs       # Vai buscar novas votações (openAR / parlamento.pt)
│   ├── fetch-noticias.mjs       # Vai buscar candidatos a novas notícias via RSS
│   └── build-feeds.mjs          # Valida e funde os JSON finais
├── .github/workflows/
│   └── weekly-update.yml        # Cron semanal: corre os scripts, abre PR
├── plan.md
└── claude.md
```

## 4. Fontes de dados

### 4.1 Votações na Assembleia da República (secção "Como vota o Chega")

Fontes oficiais e gratuitas, todas de domínio público / reutilização livre:

- **Dados Abertos da Assembleia da República** (oficial):
  `https://www.parlamento.pt/Cidadania/Paginas/DadosAbertos.aspx` — XML/JSON de
  Iniciativas, Diplomas Aprovados e Atividade Parlamentar; dados "livremente
  reutilizáveis" com indicação de fonte.
- **Arquivo de Votações** (oficial): `parlamento.pt/ArquivoDocumentacao` —
  registo histórico de votações por iniciativa.
- **openAR** (`https://openar.pt/`, API em `https://api.openar.pt/`) — agrega
  os dados oficiais em JSON já estruturado por iniciativa/evento/voto por
  partido e por deputado (A Favor / Contra / Abstenção) e por resultado
  (aprovado/rejeitado). É a via mais rápida para arrancar; o script deve
  validar contra a fonte oficial quando o resultado for usado publicamente.
- **votacoes.pt** — plataforma de referência já existente para inspiração de
  UX/visualização (não usar como scraping alvo sem verificar termos).
- Alternativa/backup: dataset em GitHub `centraldedados/parlamento` (histórico
  completo desde 1975 em JSON, gerado a partir dos dados abertos oficiais).

**Esquema proposto para `votacoes.json`:**

```json
{
  "id": "IL-XVII-1-123",
  "data": "2026-07-10",
  "titulo": "Projeto de Lei n.º 123/XVII/1 — ...",
  "tipo": "Projeto de Lei",
  "fase": "Votação final global",
  "resultado": "Aprovado",
  "votos": {
    "PS": "A Favor", "PSD": "A Favor", "CHEGA": "Contra",
    "IL": "Abstenção", "BE": "A Favor", "..." : "..."
  },
  "voto_chega": "Contra",
  "fonte_oficial": "https://www.parlamento.pt/.../DetalheIniciativa.aspx?..."
}
```

O front-end usa `voto_chega` + `resultado` para gerar indicadores visuais
rápidos (ex.: "votou contra, mas a lei passou" / "votou a favor, sozinho com
X"), sem qualquer interpretação subjetiva — apenas factos extraídos do dado
oficial.

### 4.2 Polémicas, incoerências e declarações falsas (feed tipo blog)

Não existe uma "API de polémicas" — isto é essencialmente curadoria jornalística.
Fontes gratuitas e credíveis para alimentar o feed:

- **Polígrafo** (`poligrafo.sapo.pt/fact-checks/`) — fact-checking dedicado a
  declarações de políticos portugueses, incluindo membros do CHEGA; cada
  verificação já vem com veredicto (verdadeiro/falso/impreciso) e fonte — é a
  fonte mais segura do ponto de vista editorial/legal, porque a atribuição do
  "mentira" já foi feita por um verificador terceiro e credenciado (parceiro
  Facebook/Meta fact-checking).
- Feeds RSS de imprensa generalista portuguesa (Público, Expresso, Observador,
  RTP, CNN Portugal, Diário de Notícias, SIC Notícias, Lusa) filtrados por
  palavra-chave "Chega".
- **Lusa Verifica** e outros verificadores acreditados (rede internacional
  IFCN) como segunda fonte de checagem.

**Esquema proposto para `posts.json`:**

```json
{
  "id": "2026-07-10-caso-x",
  "data_publicacao": "2026-07-10",
  "titulo": "Título curto e neutro do caso",
  "categoria": "Fact-check | Incoerência de voto | Declaração polémica | Processo judicial | Outro",
  "resumo": "1–3 frases, tom factual, sem adjetivação.",
  "pessoa": "Nome do deputado/dirigente (se aplicável)",
  "imagem_preview": "URL do og:image do artigo original (não copiada localmente)",
  "fonte": {
    "nome": "Polígrafo",
    "url": "https://poligrafo.sapo.pt/..."
  },
  "fontes_adicionais": ["https://..."],
  "tags": ["imigração", "justiça", "..."]
}
```

Clique no cartão/imagem → abre `fonte.url` numa nova aba (`target="_blank" rel="noopener"`).

## 5. Pipeline de atualização semanal (automação)

1. **GitHub Actions** (`weekly-update.yml`), cron `0 6 * * 1` (segunda-feira, 06:00 UTC).
2. `fetch-votacoes.mjs`:
   - Consulta openAR/dados abertos por novas iniciativas com votação desde a
     última execução (guarda cursor/data em `data/.last-run.json`).
   - Normaliza para o esquema de `votacoes.json`, faz *append*.
3. `fetch-noticias.mjs`:
   - Lê RSS/feeds configurados em `scripts/sources.json`, filtra por
     keywords (`chega`, nomes de dirigentes).
   - **Não publica automaticamente** — escreve candidatos em
     `data/_candidatos.json` para revisão humana (evita risco de publicar algo
     mal enquadrado ou difamatório sem verificação).
4. `build-feeds.mjs`: valida schema (datas, URLs, campos obrigatórios) e
   ordena por data.
5. A Action abre um **Pull Request** com as alterações (não faz commit direto em
   `main`) — o utilizador revê `_candidatos.json`, decide o que passa para
   `posts.json`, e faz merge. Isto mantém um humano no ciclo de decisão
   editorial sem perder a automação da recolha.
6. Merge do PR → deploy automático (GitHub Pages Action já disparada por push
   em `main`).

Este desenho cumpre o pedido de "atualização semanal automática" mas mantém
revisão humana no que é publicado como afirmação sobre uma pessoa/entidade —
importante para reduzir risco editorial.

## 6. Design / UX

- **Mobile-first**, breakpoints em ~600px; CSS Grid com `auto-fit`/`minmax()`
  para os cartões do feed, sem media queries excessivas.
- Paleta não partidária (evitar laranja/CHEGA), com azul moderno (`--accent`)
  e azul-petróleo (`--accent-2`) em gradiente; `prefers-color-scheme` para
  dark mode automático, com blobs radiais decorativos no fundo e cartões em
  vidro fosco (`backdrop-filter: blur`) para um visual mais "captivante" e
  menos genérico. Títulos em serifada (editorial), corpo em sans-serif.
- **Categorias/etiquetas:** deliberadamente discretas — ponto colorido +
  texto em caixa normal (classe `.tag`), nunca um badge maiúsculo tipo
  "FACT-CHECK". Esse estilo foi tentado e explicitamente rejeitado pelo
  utilizador por parecer "robotizado"/gerado por template.
- **Feed (index.html):** cartões numerados ("01", "02"...) com
  imagem-preview, etiqueta de categoria, título, resumo, data, fonte.
  Filtros por categoria/texto no topo.
- **Votações (votacoes.html):** apresentada como **linha do tempo
  cronológica** (mais antiga → mais recente), com marcador ligado por uma
  linha vertical, replicando o efeito de um "histórico" tipo currículo.
  Indicador visual do voto do CHEGA (cor/ícone) e do resultado final.
  Entradas em que o resultado já estava matematicamente decidido
  independentemente do voto do Chega são assinaladas com um aviso "⚠ Voto
  sem custo político" (campo `voto_simbolico` + `motivo_simbolico`) — ver
  `sobre.html` para o critério exato de quando este selo se aplica.
- **Sobre/Metodologia:** obrigatória — explica critérios de inclusão, fontes,
  como corrigir um erro, e o critério do selo "voto sem custo político".
- **Opinião (opiniao.html):** único espaço do site com tom de comentário
  (assinado, não neutro) — sempre identificado como tal visualmente, e
  sempre ancorado em factos já sourced nas outras secções.

## 7. Risco legal e editorial (importante)

- Cada afirmação factual tem de ter fonte citada e verificável — nunca afirmar
  algo que a fonte não afirma.
- Preferir sempre fact-checks de organizações acreditadas (Polígrafo, Lusa
  Verifica) para o rótulo "mentira"/"falso"; para opinião/interpretação
  própria, marcar claramente como análise, não como facto.
- Não copiar textos completos de artigos — usar resumo próprio + link.
- Não hospedar imagens de terceiros sem licença — usar apenas preview/thumbnail
  com link de saída (mesma lógica de um link preview do WhatsApp) ou imagens
  de domínio público (ex.: fotos oficiais da Assembleia da República,
  normalmente reutilizáveis com atribuição).
- Incluir página "Sobre" com metodologia e mecanismo de correção/direito de
  resposta.
- Manter separação clara entre a secção de votos (dados oficiais, factuais,
  sem interpretação) e a secção editorial de polémicas (curadoria, com fonte).

## 8. Fases de implementação

1. **Fase 0 — Fundação:** ✅ estrutura de ficheiros, `claude.md`, esqueleto
   HTML/CSS responsivo.
2. **Fase 1 — Feed de polémicas:** ✅ `index.html` funcional, com dados reais
   (não mock) desde o início, filtros, layout responsivo, cartões numerados.
3. **Fase 2 — Secção de votações:** ✅ `votacoes.html` com 14 votações reais
   (2023–2026), apresentadas em linha do tempo cronológica, com o selo "voto
   sem custo político" nos casos aplicáveis.
4. **Fase 2.5 — Página de Opinião:** ✅ `opiniao.html`, comentário assinado
   (A.M.), ancorado nos factos documentados nas outras secções.
5. **Fase 3 — Scripts de recolha:** ✅ esqueleto criado
   (`fetch-votacoes.mjs`/`fetch-noticias.mjs`/`build-feeds.mjs`); recolha real
   de conteúdo continua a ser feita manualmente por sessões do Claude Code via
   pesquisa web, não pela automação ainda.
6. **Fase 4 — Automação:** workflow `weekly-update.yml` criado, mas as
   permissões de GitHub Actions (Settings → Actions → Workflow permissions)
   ainda não foram confirmadas pelo utilizador — pendente.
7. **Fase 5 — Deploy:** ✅ publicado em GitHub Pages
   (`realnewsPT/real-news`, branch `main`), deploy automático a cada push.
8. **Fase 6 — Conteúdo:** em curso — alargar continuamente o histórico de
   votações e o feed de polémicas, sempre com fonte verificável.

## 9. Próximos passos imediatos

- Ativar permissões de GitHub Actions (Settings → Actions → General →
  Workflow permissions → Read and write) para o `weekly-update.yml` poder
  abrir Pull Requests automaticamente.
- Continuar a alargar o histórico de votações (idealmente cobrindo toda a
  legislatura atual) e o feed de polémicas.
- Validar o endpoint exato da openAR API antes de confiar em
  `fetch-votacoes.mjs` para automação real — por agora, a recolha de
  votações tem sido feita manualmente com verificação cruzada de várias
  fontes noticiosas.
- Considerar domínio próprio (o nome do projeto ficou definido como
  **REAL-NEWS**, publicado em `realnewsPT/real-news` no GitHub).
