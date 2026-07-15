import { fetchJSON, formatDate, escapeHTML, normalize } from "./utils.js";

const list = document.getElementById("vote-list");
const inputTexto = document.getElementById("filtro-texto");
const selectVoto = document.getElementById("filtro-voto");
const selectResultado = document.getElementById("filtro-resultado");

let votacoes = [];

function pillClass(voto) {
  if (voto === "A Favor") return "pill--favor";
  if (voto === "Contra") return "pill--contra";
  return "pill--abstencao";
}

function resultTagClass(resultado) {
  return resultado === "Aprovado" ? "result-tag--aprovado" : "result-tag--rejeitado";
}

function matches(v, texto, voto, resultado) {
  if (voto && v.voto_chega !== voto) return false;
  if (resultado && v.resultado !== resultado) return false;
  if (!texto) return true;
  return normalize(v.titulo).includes(normalize(texto));
}

function renderVotosPorPartido(votos) {
  const entradas = Object.entries(votos || {});
  if (!entradas.length) return "";
  const linhas = entradas
    .map(([partido, voto]) => `<tr><td>${escapeHTML(partido)}</td><td>${escapeHTML(voto)}</td></tr>`)
    .join("");
  return `
    <details class="votes-table-wrap">
      <summary>Ver voto de todos os partidos</summary>
      <table class="votes-table">
        <thead><tr><th>Partido</th><th>Voto</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </details>
  `;
}

function renderVotacao(v) {
  const imagem = v.imagem_preview
    ? `<img src="${escapeHTML(v.imagem_preview)}" alt="" loading="lazy" class="vote-card__image" />`
    : "";
  const simbolico = Boolean(v.voto_simbolico);
  const chip = simbolico
    ? `<p class="vote-card__simbolico-chip"><strong>⚠ Voto sem custo político.</strong> ${escapeHTML(v.motivo_simbolico || "O resultado já estava decidido independentemente do sentido de voto do Chega.")}</p>`
    : "";
  return `
    <div class="vote-item">
      <span class="vote-item__marker ${simbolico ? "vote-item__marker--simbolico" : ""}"></span>
      <p class="vote-item__date">${formatDate(v.data)}</p>
      <article class="vote-card ${simbolico ? "vote-card--simbolico" : ""}">
        ${imagem}
        <div>
          <p class="vote-card__title">${escapeHTML(v.titulo)}</p>
          <p class="vote-card__meta">${escapeHTML(v.tipo || "")} · ${escapeHTML(v.fase || "")}</p>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.4rem; align-items:flex-end;">
          <span class="pill ${pillClass(v.voto_chega)}">Chega: ${escapeHTML(v.voto_chega)}</span>
          <span class="result-tag ${resultTagClass(v.resultado)}">${escapeHTML(v.resultado)}</span>
        </div>
        ${chip}
        ${v.notas ? `<p class="vote-card__notes">${escapeHTML(v.notas)}</p>` : ""}
        ${renderVotosPorPartido(v.votos)}
        <p class="vote-card__source">Fonte: <a href="${escapeHTML(v.fonte_oficial)}" target="_blank" rel="noopener">${escapeHTML(v.fonte_oficial)}</a></p>
      </article>
    </div>
  `;
}

function render() {
  const texto = inputTexto.value.trim();
  const voto = selectVoto.value;
  const resultado = selectResultado.value;
  const filtradas = votacoes
    .filter((v) => matches(v, texto, voto, resultado))
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  list.innerHTML = filtradas.length
    ? filtradas.map(renderVotacao).join("")
    : `<p class="empty-state">Nenhuma votação encontrada com estes filtros.</p>`;
}

async function init() {
  try {
    votacoes = await fetchJSON("data/votacoes.json");
    render();
  } catch (err) {
    list.innerHTML = `<p class="empty-state">Não foi possível carregar os dados. (${escapeHTML(err.message)})</p>`;
  }
}

inputTexto.addEventListener("input", render);
selectVoto.addEventListener("change", render);
selectResultado.addEventListener("change", render);

init();
