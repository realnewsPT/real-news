import { fetchJSON, formatDate, escapeHTML, normalize } from "./utils.js";

const grid = document.getElementById("post-grid");
const inputTexto = document.getElementById("filtro-texto");
const selectCategoria = document.getElementById("filtro-categoria");

let posts = [];

function populateCategorias() {
  const categorias = [...new Set(posts.map((p) => p.categoria).filter(Boolean))].sort();
  for (const cat of categorias) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    selectCategoria.appendChild(opt);
  }
}

function matches(post, texto, categoria) {
  if (categoria && post.categoria !== categoria) return false;
  if (!texto) return true;
  const haystack = normalize(
    [post.titulo, post.resumo, post.pessoa, ...(post.tags || [])].join(" ")
  );
  return haystack.includes(normalize(texto));
}

const CATEGORY_SLOTS = new Map();
function categorySlot(categoria) {
  if (!CATEGORY_SLOTS.has(categoria)) {
    CATEGORY_SLOTS.set(categoria, (CATEGORY_SLOTS.size % 5) + 1);
  }
  return CATEGORY_SLOTS.get(categoria);
}

function renderPost(post, index) {
  const hasImage = Boolean(post.imagem_preview);
  const numero = String(index + 1).padStart(2, "0");
  const cat = categorySlot(post.categoria);
  return `
    <article class="post-card">
      <a class="post-card__link" href="${escapeHTML(post.fonte?.url || "#")}" target="_blank" rel="noopener">
        <div class="post-card__image">
          <span class="post-card__index" data-cat="${cat}">${numero}</span>
          <span class="tag--overlay" data-cat="${cat}">${escapeHTML(post.categoria || "Outro")}</span>
          ${hasImage
            ? `<img src="${escapeHTML(post.imagem_preview)}" alt="" loading="lazy" />`
            : "Sem imagem de pré-visualização"}
        </div>
        <div class="post-card__body">
          <h2 class="post-card__title">${escapeHTML(post.titulo)}</h2>
          <p class="post-card__summary">${escapeHTML(post.resumo)}</p>
          <div class="post-card__meta">
            <span>${escapeHTML(post.pessoa || "")}</span>
            <span>${formatDate(post.data_publicacao)}</span>
          </div>
          <div class="post-card__footer">
            <span class="post-card__meta">Fonte: ${escapeHTML(post.fonte?.nome || "")}</span>
            <span class="post-card__arrow" aria-hidden="true">↗</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function render() {
  const texto = inputTexto.value.trim();
  const categoria = selectCategoria.value;
  const filtrados = posts
    .filter((p) => matches(p, texto, categoria))
    .sort((a, b) => (a.data_publicacao < b.data_publicacao ? 1 : -1));

  grid.innerHTML = filtrados.length
    ? filtrados.map((post, i) => renderPost(post, i)).join("")
    : `<p class="empty-state">Nenhuma entrada encontrada com estes filtros.</p>`;
}

async function init() {
  try {
    posts = await fetchJSON("data/posts.json");
    populateCategorias();
    render();
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Não foi possível carregar os dados. (${escapeHTML(err.message)})</p>`;
  }
}

inputTexto.addEventListener("input", render);
selectCategoria.addEventListener("change", render);

init();
